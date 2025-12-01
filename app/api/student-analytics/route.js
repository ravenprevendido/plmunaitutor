// /api/student-analytics/route.js
import { db } from '@/config/db';
import { 
  enrollmentsTable, 
  coursesTable, 
  studentProgressTable, 
  lessonsTable, 
  quizzesTable, 
  assignmentsTable,
  lessonProgressTable
} from '@/config/schema';
import { eq, and, inArray, sql, gte, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student's enrolled courses (only approved)
    const enrollments = await db
      .select({
        course_id: enrollmentsTable.course_id,
        progress: enrollmentsTable.progress,
        course_title: enrollmentsTable.course_title,
      })
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.student_id, userId),
          eq(enrollmentsTable.status, 'approved')
        )
      );

    if (enrollments.length === 0) {
      return NextResponse.json({
        subjectMastery: [],
        lessonCompletionRate: { completed: 0, inProgress: 0, total: 0 },
        dailyStudyTime: []
      });
    }

    const courseIds = enrollments.map(e => e.course_id);

    // 1. SUBJECT MASTERY - Calculate progress for each enrolled course
    const subjectMastery = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get total items (lessons + quizzes + assignments) for this course
        const [lessons, quizzes, assignments] = await Promise.all([
          db.select().from(lessonsTable).where(eq(lessonsTable.course_id, enrollment.course_id)),
          db.select().from(quizzesTable).where(eq(quizzesTable.course_id, enrollment.course_id)),
          db.select().from(assignmentsTable).where(eq(assignmentsTable.course_id, enrollment.course_id))
        ]);

        const totalItems = lessons.length + quizzes.length + assignments.length;

        // Get completed items for this course
        const completedProgress = await db
          .select()
          .from(studentProgressTable)
          .where(
            and(
              eq(studentProgressTable.student_id, userId),
              eq(studentProgressTable.course_id, enrollment.course_id),
              eq(studentProgressTable.completed, true)
            )
          );

        const completedCount = completedProgress.length;
        const percent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        return {
          title: enrollment.course_title,
          percent: percent
        };
      })
    );

    // 2. LESSON COMPLETION RATE - Count completed vs in-progress items
    // Get all progress records for enrolled courses
    const allProgress = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          inArray(studentProgressTable.course_id, courseIds)
        )
      );

    // Count completed items
    const completedCount = allProgress.filter(p => p.completed === true).length;

    // Count in-progress items (started but not completed)
    const inProgressCount = allProgress.filter(p => p.completed === false).length;

    // Get total items across all enrolled courses
    const [allLessons, allQuizzes, allAssignments] = await Promise.all([
      db.select().from(lessonsTable).where(inArray(lessonsTable.course_id, courseIds)),
      db.select().from(quizzesTable).where(inArray(quizzesTable.course_id, courseIds)),
      db.select().from(assignmentsTable).where(inArray(assignmentsTable.course_id, courseIds))
    ]);

    const totalItems = allLessons.length + allQuizzes.length + allAssignments.length;
    const notStartedCount = totalItems - completedCount - inProgressCount;

    // 3. DAILY STUDY TIME - Track from lessonProgressTable (Study Plan lessons)
    // Get current week (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDay + 1); // Monday
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Sunday
    endDate.setHours(23, 59, 59, 999);

    // Get study sessions from lessonProgressTable (Study Plan tracking)
    const studySessions = await db
      .select({
        started_at: lessonProgressTable.started_at,
        last_accessed: lessonProgressTable.last_accessed,
        total_pages: lessonProgressTable.total_pages,
        current_page: lessonProgressTable.current_page,
        completed: lessonProgressTable.completed,
      })
      .from(lessonProgressTable)
      .where(
        and(
          eq(lessonProgressTable.user_id, userId),
          gte(lessonProgressTable.started_at, startDate),
          lte(lessonProgressTable.started_at, endDate)
        )
      );

    // Calculate study time per day for the current week
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyStudyTime = dayOrder.map((dayName, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + index);
      dayDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(dayDate);
      nextDay.setDate(dayDate.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      // Count sessions that started on this day
      const daySessions = studySessions.filter(session => {
        const sessionDate = new Date(session.started_at);
        return sessionDate >= dayDate && sessionDate < nextDay;
      });

      // Calculate hours: estimate based on progress
      // Each session: estimate 0.5 hours (30 mins) base time
      // If completed or has significant progress, add more time
      let totalHours = 0;
      daySessions.forEach(session => {
        let sessionHours = 0.5; // Base 30 minutes
        
        // If completed, estimate full session time (1 hour)
        if (session.completed) {
          sessionHours = 1.0;
        } 
        // If significant progress (more than 50%), estimate more time
        else if (session.total_pages > 0 && session.current_page > 0) {
          const progressPercent = (session.current_page / session.total_pages) * 100;
          if (progressPercent > 50) {
            sessionHours = 0.75; // 45 minutes
          }
        }
        
        totalHours += sessionHours;
      });

      return {
        day: dayName,
        hours: Math.round(totalHours * 10) / 10 // Round to 1 decimal
      };
    });

    const analyticsData = {
      subjectMastery: subjectMastery.sort((a, b) => b.percent - a.percent), // Sort by highest progress
      lessonCompletionRate: {
        completed: completedCount,
        inProgress: inProgressCount + notStartedCount, // Include not started as in progress
        total: totalItems
      },
      dailyStudyTime: dailyStudyTime,
      weakAreas: subjectMastery
        .filter(s => s.percent < 50)
        .map(s => s.title),
      studyPattern: 'regular', // Can be enhanced with actual pattern analysis
      recommendedFocus: subjectMastery
        .filter(s => s.percent < 70)
        .map(s => s.title)
        .slice(0, 3)
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: error.message 
    }, { status: 500 });
  }
}
