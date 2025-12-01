// api/courses/[id]/progress/route.js
import { db } from '@/config/db';
import { studentProgressTable, lessonsTable, quizzesTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student's progress for this course
    const progressRecords = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.course_id, parseInt(id))
        )
      );

    // Calculate progress metrics
    const completedLessons = progressRecords
      .filter(record => record.lesson_id && record.completed)
      .map(record => record.lesson_id);

    const completedQuizzes = progressRecords
      .filter(record => record.quiz_id && record.completed)
      .map(record => record.quiz_id);

    const submittedAssignments = progressRecords
      .filter(record => record.assignment_id && record.completed)
      .map(record => record.assignment_id);

    // Get total counts
    const [totalLessons, totalQuizzes] = await Promise.all([
      db
        .select()
        .from(lessonsTable)
        .where(eq(lessonsTable.course_id, parseInt(id)))
        .then(rows => rows.length),
      
      db
        .select()
        .from(quizzesTable)
        .where(eq(quizzesTable.course_id, parseInt(id)))
        .then(rows => rows.length)
    ]);

    return NextResponse.json({
      lessonsCompleted: completedLessons.length,
      quizzesCompleted: completedQuizzes.length,
      assignmentsSubmitted: submittedAssignments.length,
      totalLessons,
      totalQuizzes,
      completedLessons,
      completedQuizzes: completedQuizzes, // This is the ARRAY of completed quiz IDs
      submittedAssignments,
      quizzes: completedQuizzes.map(quizId => ({ quiz_id: quizId, completed: true }))
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}