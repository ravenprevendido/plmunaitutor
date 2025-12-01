import { db } from '@/config/db';
import { 
  studentProgressTable, 
  quizzesTable, 
  assignmentsTable,
  lessonsTable,
  coursesTable,
  enrollmentsTable
} from '@/config/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📊 Fetching comprehensive weekly progress for user:", userId);

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
        weeklyData: [],
        subjects: [],
        totalWeeks: 0
      });
    }

    const courseIds = enrollments.map(e => e.course_id);
    const courseMap = new Map(enrollments.map(e => [e.course_id, e.course_title]));

    // Get last 6 weeks of data
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42); // 6 weeks * 7 days

    // Get all completed progress (quizzes, assignments, lessons) in the last 6 weeks
    // Use COALESCE to handle cases where submitted_at might be null (use created_at as fallback)
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
        week: sql`DATE_TRUNC('week', COALESCE(${studentProgressTable.submitted_at}, ${studentProgressTable.created_at}))`.as('week')
      })
      .from(studentProgressTable)
      .innerJoin(coursesTable, eq(studentProgressTable.course_id, coursesTable.id))
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.completed, true),
          gte(
            sql`COALESCE(${studentProgressTable.submitted_at}, ${studentProgressTable.created_at})`,
            sixWeeksAgo
          )
        )
      )
      .orderBy(sql`week`);

    console.log("📈 Raw progress records:", allProgress.length);

    if (allProgress.length === 0) {
      return NextResponse.json({
        weeklyData: [],
        subjects: Array.from(courseMap.values()),
        totalWeeks: 0
      });
    }

    // Process weekly data
    const weeklyData = processWeeklyData(allProgress, courseMap);
    const subjects = Array.from(courseMap.values());

    console.log("✅ Processed weekly data:", weeklyData);
    return NextResponse.json({
      weeklyData,
      subjects,
      totalWeeks: weeklyData.length
    });

  } catch (error) {
    console.error('❌ Error fetching weekly progress:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch progress data',
      details: error.message 
    }, { status: 500 });
  }
}

function processWeeklyData(progressRecords, courseMap) {
  const weeksMap = new Map();
  
  // Group progress by week and course
  progressRecords.forEach(record => {
    const weekStart = new Date(record.week);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeksMap.has(weekKey)) {
      weeksMap.set(weekKey, {
        week: weekKey,
        weekLabel: getWeekLabel(weekStart),
        subjects: {}
      });
    }
    
    const weekData = weeksMap.get(weekKey);
    const subject = record.course_title || courseMap.get(record.course_id) || 'Unknown';
    
    if (!weekData.subjects[subject]) {
      weekData.subjects[subject] = {
        quizzes: { count: 0, scores: [], average: 0 },
        assignments: { count: 0, scores: [], average: 0 },
        lessons: { count: 0, average: 0 },
        overall: { total: 0, completed: 0, progress: 0 }
      };
    }
    
    const subjectData = weekData.subjects[subject];
    
    // Categorize by type
    if (record.type === 'quiz' && record.score !== null) {
      subjectData.quizzes.count++;
      subjectData.quizzes.scores.push(record.score);
    } else if (record.type === 'assignment' && record.score !== null) {
      subjectData.assignments.count++;
      subjectData.assignments.scores.push(record.score);
    } else if (record.type === 'lesson') {
      subjectData.lessons.count++;
    }
    
    subjectData.overall.completed++;
  });
  
  // Calculate averages and overall progress
  const weeklyData = Array.from(weeksMap.values())
    .sort((a, b) => new Date(a.week) - new Date(b.week))
    .map(week => {
      Object.keys(week.subjects).forEach(subject => {
        const subjectData = week.subjects[subject];
        
        // Calculate quiz average
        if (subjectData.quizzes.scores.length > 0) {
          subjectData.quizzes.average = Math.round(
            subjectData.quizzes.scores.reduce((a, b) => a + b, 0) / subjectData.quizzes.scores.length
          );
        }
        
        // Calculate assignment average
        if (subjectData.assignments.scores.length > 0) {
          subjectData.assignments.average = Math.round(
            subjectData.assignments.scores.reduce((a, b) => a + b, 0) / subjectData.assignments.scores.length
          );
        }
        
        // Calculate overall progress (weighted: quizzes 40%, assignments 30%, lessons 30%)
        const quizWeight = subjectData.quizzes.average * 0.4;
        const assignmentWeight = subjectData.assignments.average * 0.3;
        const lessonWeight = subjectData.lessons.count > 0 ? 100 * 0.3 : 0; // Assume 100% for completed lessons
        
        subjectData.overall.progress = Math.round(quizWeight + assignmentWeight + lessonWeight);
        
        // Calculate average for display (simple average of all components)
        const components = [];
        if (subjectData.quizzes.average > 0) components.push(subjectData.quizzes.average);
        if (subjectData.assignments.average > 0) components.push(subjectData.assignments.average);
        if (subjectData.lessons.count > 0) components.push(100); // Completed lessons count as 100%
        
        subjectData.average = components.length > 0
          ? Math.round(components.reduce((a, b) => a + b, 0) / components.length)
          : 0;
      });
      
      return week;
    });

  // Ensure we have exactly 6 weeks of data (fill missing weeks if needed)
  const last6Weeks = getLast6Weeks();
  const filledData = last6Weeks.map(week => {
    const existing = weeklyData.find(w => w.week === week.week);
    return existing || week;
  });

  return filledData.slice(-6);
}

function getWeekLabel(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  // Get week number from start of year
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  
  return `Week ${weekNumber}`;
}

function getLast6Weeks() {
  const weeks = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - (i * 7));
    const weekStart = new Date(weekDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    
    weeks.push({
      week: weekStart.toISOString().split('T')[0],
      weekLabel: getWeekLabel(weekStart),
      subjects: {}
    });
  }
  
  return weeks;
}

