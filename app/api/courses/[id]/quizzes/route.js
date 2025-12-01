// app/api/courses/[id]/quizzes/route.js
import { db } from '@/config/db';
import { quizzesTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    
    console.log(`📝 Fetching quizzes for course ID: ${courseId}`);
    
    const quizzes = await db
      .select()
      .from(quizzesTable)
      .where(eq(quizzesTable.course_id, courseId))
      .orderBy(quizzesTable.created_at);

    console.log(`✅ Found ${quizzes.length} quizzes for course ${courseId}`);
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('❌ Error fetching quizzes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    const { title, description, questions, deadline } = await request.json();

    console.log(`🆕 Creating quiz for course ID: ${courseId}`);

    const newQuiz = await db
      .insert(quizzesTable)
      .values({
        course_id: courseId,
        title,
        description,
        questions: questions || [],
        deadline: deadline ? new Date(deadline) : null
      })
      .returning();

    console.log(`✅ Quiz created successfully for course ${courseId}`);
    return NextResponse.json(newQuiz[0], { status: 201 });
  } catch (error) {
    console.error('❌ Error creating quiz:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}