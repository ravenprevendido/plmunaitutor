// app/api/student-questions/route.js
import { db } from '@/config/db';
import { studentQuestionsTable } from '@/config/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// POST - Save student question
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { question, ai_response, subject, course_id } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student info from Clerk (you might want to get this from your users table)
    const user = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
      }
    }).then(res => res.json());

    const studentQuestion = await db
      .insert(studentQuestionsTable)
      .values({
        student_id: userId,
        student_name: user.first_name || user.username || 'Student',
        student_avatar: user.image_url,
        course_id: course_id || null,
        course_title: subject || 'General',
        question: question,
        ai_response: ai_response,
        subject: subject || 'General',
        question_type: 'general',
        is_common: false, // You can set logic to detect common questions
        asked_at: new Date()
      })
      .returning();

    return NextResponse.json(studentQuestion[0], { status: 201 });

  } catch (error) {
    console.error('❌ Error saving student question:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get student's own questions (for student view)
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;

    const questions = await db
      .select()
      .from(studentQuestionsTable)
      .where(eq(studentQuestionsTable.student_id, userId))
      .orderBy(desc(studentQuestionsTable.asked_at))
      .limit(limit);

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('❌ Error fetching student questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}