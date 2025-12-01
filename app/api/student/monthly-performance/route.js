import { db } from '@/config/db';
import { 
  studentProgressTable, 
  quizzesTable, 
  assignmentsTable,
  lessonsTable,
  coursesTable,
  enrollmentsTable
} from '@/config/schema';
import { eq, and, gte, inArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectFilter = searchParams.get('subject'); // Optional subject filter

    console.log("📊 Fetching monthly performance for user:", userId, "subject:", subjectFilter);

    // Get student's enrolled courses
    const enrollments = await db
      .select({
        course_id: enrollmentsTable.course_id,
        course_title: coursesTable.title,
      })
      .from(enrollmentsTable)
      .innerJoin(coursesTable, eq(enrollmentsTable.course_id, coursesTable.id))
      .where(
        and(
          eq(enrollmentsTable.student_id, userId),
          eq(enrollmentsTable.status, 'approved')
        )
      );

    if (enrollments.length === 0) {
      return NextResponse.json({
        monthlyData: [],
        subjects: [],
        currentMonth: null,
        previousMonth: null,
        comparison: 0
      });
    }

    const courseIds = enrollments.map(e => e.course_id);
    const courseMap = new Map(enrollments.map(e => [e.course_id, e.course_title]));
    const allSubjects = Array.from(courseMap.values());

    // Filter by subject if provided
    let filteredCourseIds = courseIds;
    if (subjectFilter && subjectFilter !== 'all') {
      const filteredEnrollments = enrollments.filter(e => e.course_title === subjectFilter);
      filteredCourseIds = filteredEnrollments.map(e => e.course_id);
    }

    // Get last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get all completed progress in the last 6 months
    const allProgress = await db
      .select({
        course_id: studentProgressTable.course_id,
        course_title: coursesTable.title,
        score: studentProgressTable.score,
        submitted_at: studentProgressTable.submitted_at,
        created_at: studentProgressTable.created_at,
        completed: studentProgressTable.completed,
        type: sql`
          CASE 
            WHEN ${studentProgressTable.quiz_id} IS NOT NULL THEN 'quiz'
            WHEN ${studentProgressTable.assignment_id} IS NOT NULL THEN 'assignment'
            WHEN ${studentProgressTable.lesson_id} IS NOT NULL THEN 'lesson'
            ELSE 'unknown'
          END
        `.as('type'),
        month: sql`DATE_TRUNC('month', COALESCE(${studentProgressTable.submitted_at}, ${studentProgressTable.created_at}))`.as('month')
      })
      .from(studentProgressTable)
      .innerJoin(coursesTable, eq(studentProgressTable.course_id, coursesTable.id))
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.completed, true),
          inArray(studentProgressTable.course_id, filteredCourseIds),
          gte(
            sql`COALESCE(${studentProgressTable.submitted_at}, ${studentProgressTable.created_at})`,
            sixMonthsAgo
          )
        )
      )
      .orderBy(sql`month`);

    console.log("📈 Raw progress records:", allProgress.length);

    // Process monthly data
    const monthlyData = processMonthlyData(allProgress, courseMap);
    
    // Get current and previous month for comparison
    const now = new Date();
    const currentMonth = getMonthKey(now);
    const previousMonth = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    
    const currentMonthData = monthlyData.find(m => m.month === currentMonth);
    const previousMonthData = monthlyData.find(m => m.month === previousMonth);
    
    const currentScore = currentMonthData?.overall || 0;
    const previousScore = previousMonthData?.overall || 0;
    const comparison = previousScore > 0 
      ? Math.round(((currentScore - previousScore) / previousScore) * 100)
      : (currentScore > 0 ? 100 : 0);

    console.log("✅ Processed monthly data:", monthlyData);
    return NextResponse.json({
      monthlyData,
      subjects: allSubjects,
      currentMonth: currentMonthData,
      previousMonth: previousMonthData,
      comparison
    });

  } catch (error) {
    console.error('❌ Error fetching monthly performance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch performance data',
      details: error.message 
    }, { status: 500 });
  }
}

function processMonthlyData(progressRecords, courseMap) {
  const monthsMap = new Map();
  
  // Group progress by month
  progressRecords.forEach(record => {
    const monthDate = new Date(record.month);
    const monthKey = getMonthKey(monthDate);
    
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, {
        month: monthKey,
        monthLabel: getMonthLabel(monthDate),
        quizzes: { count: 0, scores: [], average: 0 },
        assignments: { count: 0, scores: [], average: 0 },
        lessons: { count: 0, average: 0 },
        overall: 0
      });
    }
    
    const monthData = monthsMap.get(monthKey);
    
    // Categorize by type
    if (record.type === 'quiz' && record.score !== null) {
      monthData.quizzes.count++;
      monthData.quizzes.scores.push(record.score);
    } else if (record.type === 'assignment' && record.score !== null) {
      monthData.assignments.count++;
      monthData.assignments.scores.push(record.score);
    } else if (record.type === 'lesson') {
      monthData.lessons.count++;
    }
  });
  
  // Calculate averages and overall progress
  const monthlyData = Array.from(monthsMap.values())
    .sort((a, b) => new Date(a.month) - new Date(b.month))
    .map(month => {
      // Calculate quiz average
      if (month.quizzes.scores.length > 0) {
        month.quizzes.average = Math.round(
          month.quizzes.scores.reduce((a, b) => a + b, 0) / month.quizzes.scores.length
        );
      }
      
      // Calculate assignment average
      if (month.assignments.scores.length > 0) {
        month.assignments.average = Math.round(
          month.assignments.scores.reduce((a, b) => a + b, 0) / month.assignments.scores.length
        );
      }
      
      // Calculate overall progress (weighted: quizzes 40%, assignments 30%, lessons 30%)
      const quizWeight = month.quizzes.average * 0.4;
      const assignmentWeight = month.assignments.average * 0.3;
      const lessonWeight = month.lessons.count > 0 ? 100 * 0.3 : 0;
      
      month.overall = Math.round(quizWeight + assignmentWeight + lessonWeight);
      
      return month;
    });

  // Ensure we have exactly 6 months of data (fill missing months if needed)
  const last6Months = getLast6Months();
  const filledData = last6Months.map(month => {
    const existing = monthlyData.find(m => m.month === month.month);
    return existing || month;
  });

  return filledData.slice(-6);
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: getMonthKey(monthDate),
      monthLabel: getMonthLabel(monthDate),
      quizzes: { count: 0, scores: [], average: 0 },
      assignments: { count: 0, scores: [], average: 0 },
      lessons: { count: 0, average: 0 },
      overall: 0
    });
  }
  
  return months;
}

