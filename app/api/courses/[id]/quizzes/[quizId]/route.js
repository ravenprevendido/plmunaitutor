// app/api/courses/[id]/quizzes/[quizId]/route.js
import { db } from '@/config/db';
import { quizzesTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id, quizId } = await params;
    
    console.log("🔍 Fetching quiz:", { courseId: id, quizId });

    if (!id || !quizId) {
      return NextResponse.json({ error: 'Course ID and Quiz ID are required' }, { status: 400 });
    }

    const quiz = await db
      .select()
      .from(quizzesTable)
      .where(
        and(
          eq(quizzesTable.course_id, parseInt(id)),
          eq(quizzesTable.id, parseInt(quizId))
        )
      )
      .limit(1);

    if (quiz.length === 0) {
      console.log("❌ Quiz not found");
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    console.log("✅ Found quiz:", quiz[0]);
    return NextResponse.json(quiz[0]);
  } catch (error) {
    console.error('❌ Error fetching quiz:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}