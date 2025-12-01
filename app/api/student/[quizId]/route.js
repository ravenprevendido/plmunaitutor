import { db } from '@/config/db';
import { quizzesTable, coursesTable, studentProgressTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { quizId } = await params;
    
    console.log("🔍 Fetching quiz results for quiz ID:", quizId, "User ID:", userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get quiz with course information
    const quiz = await db
      .select({
        id: quizzesTable.id,
        title: quizzesTable.title,
        description: quizzesTable.description,
        questions: quizzesTable.questions,
        course_id: quizzesTable.course_id,
        course_title: coursesTable.title,
        created_at: quizzesTable.created_at,
        deadline: quizzesTable.deadline,
      })
      .from(quizzesTable)
      .innerJoin(coursesTable, eq(quizzesTable.course_id, coursesTable.id))
      .where(eq(quizzesTable.id, parseInt(quizId)))
      .then(rows => rows[0]);

    if (!quiz) {
      console.log("❌ Quiz not found");
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    console.log("✅ Quiz data found:", quiz.title);

    // Get student's progress for this quiz - FIXED QUERY
    const progress = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.quiz_id, parseInt(quizId)),
          eq(studentProgressTable.completed, true) // Only get completed quizzes
        )
      )
      .then(rows => rows[0]);

    console.log("📊 Student progress found:", progress);

    if (!progress) {
      console.log("❌ No completed progress record found for this quiz");
      return NextResponse.json({ 
        error: 'Quiz not completed or progress not found',
        quiz: quiz
      }, { status: 404 });
    }

    // Calculate actual time taken if we have submission data
    let timeTaken = '15:30'; // Default fallback
    if (progress.submitted_at && progress.created_at) {
      const submitted = new Date(progress.submitted_at);
      const created = new Date(progress.created_at);
      const diffMs = submitted - created;
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      timeTaken = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Return combined data with REAL progress
    const responseData = {
      quiz: {
        ...quiz,
        difficulty: 'medium',
        timeSpent: timeTaken, // Use calculated time
        course: quiz.course_title,
        courseId: quiz.course_id
      },
      progress: progress
    };

    console.log("✅ Returning REAL progress data:", {
      score: progress.score,
      answers: progress.answers,
      timeTaken: timeTaken
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error in quiz results API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}