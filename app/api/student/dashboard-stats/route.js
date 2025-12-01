// app/api/student/dashboard-stats/route.js
import { db } from '@/config/db';
import { enrollmentsTable, quizzesTable, studentProgressTable } from '@/config/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📊 Fetching dashboard stats for student:", userId);

    // Get student's enrolled courses (only approved enrollments)
    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.student_id, userId),
          eq(enrollmentsTable.status, 'approved')
        )
      );

    if (enrollments.length === 0) {
      return NextResponse.json({
        coursesInProgress: 0,
        coursesCompleted: 0,
        upcomingQuizzes: 0
      });
    }

    // Calculate courses in progress (progress > 0 and < 100)
    const coursesInProgress = enrollments.filter(
      enrollment => enrollment.progress > 0 && enrollment.progress < 100
    ).length;

    // Calculate completed courses (progress = 100)
    const coursesCompleted = enrollments.filter(
      enrollment => enrollment.progress === 100
    ).length;

    // Get course IDs for quiz queries
    const courseIds = enrollments.map(enrollment => enrollment.course_id);

    // Get all quizzes for enrolled courses
    const allQuizzes = await db
      .select({
        id: quizzesTable.id,
        course_id: quizzesTable.course_id,
        deadline: quizzesTable.deadline,
      })
      .from(quizzesTable)
      .where(inArray(quizzesTable.course_id, courseIds));

    // Get student's progress for all quizzes
    const progressRecords = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          inArray(studentProgressTable.course_id, courseIds),
          eq(studentProgressTable.completed, true)
        )
      );

    const completedQuizIds = new Set(
      progressRecords
        .filter(record => record.quiz_id !== null)
        .map(record => record.quiz_id)
    );

    // Calculate upcoming quizzes (not completed, deadline in future or no deadline)
    const now = new Date();
    const upcomingQuizzes = allQuizzes.filter(quiz => {
      const isCompleted = completedQuizIds.has(quiz.id);
      if (isCompleted) return false;
      
      // If no deadline, consider it upcoming
      if (!quiz.deadline) return true;
      
      // If deadline is in the future, it's upcoming
      const deadline = new Date(quiz.deadline);
      return deadline >= now;
    }).length;

    const stats = {
      coursesInProgress,
      coursesCompleted,
      upcomingQuizzes
    };

    console.log("✅ Dashboard stats:", stats);
    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

