// app/api/student/quizzes/route.js
import { db } from '@/config/db';
import { quizzesTable, studentProgressTable, coursesTable, enrollmentsTable } from '@/config/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      return NextResponse.json([]);
    }

    const courseIds = enrollments.map(enrollment => enrollment.course_id);

    // Get all quizzes for ALL enrolled courses
    const allQuizzes = await db
      .select({
        id: quizzesTable.id,
        title: quizzesTable.title,
        description: quizzesTable.description,
        course_id: quizzesTable.course_id,
        course_title: coursesTable.title,
        deadline: quizzesTable.deadline,
        questions: quizzesTable.questions,
        created_at: quizzesTable.created_at,
      })
      .from(quizzesTable)
      .innerJoin(coursesTable, eq(quizzesTable.course_id, coursesTable.id))
      .where(inArray(coursesTable.id, courseIds))
      .orderBy(quizzesTable.created_at);

    // Get student's progress for ALL quizzes in enrolled courses
    const progressRecords = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          inArray(studentProgressTable.course_id, courseIds)
        )
      );

    // Combine quiz data with progress
    const quizzesWithProgress = allQuizzes.map(quiz => {
      const progress = progressRecords.find(record => 
        record.quiz_id === quiz.id && record.course_id === quiz.course_id
      );
      
      const now = new Date();
      const dueDate = quiz.deadline ? new Date(quiz.deadline) : null;
      
      // Determine status: Completed > Overdue > Pending
      let status = 'Pending';
      if (progress?.completed) {
        status = 'Completed';
      } else if (dueDate && dueDate < now) {
        status = 'Overdue';
      }

      return {
        id: quiz.id,
        title: quiz.title,
        course: quiz.course_title,
        courseId: quiz.course_id,
        due: dueDate 
          ? dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : 'No deadline',
        status,
        score: progress?.score ? `${progress.score}%` : null,
        completed: progress?.completed || false,
        description: quiz.description || '',
      };
    });

    return NextResponse.json(quizzesWithProgress);

  } catch (error) {
    console.error('Error fetching student quizzes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}