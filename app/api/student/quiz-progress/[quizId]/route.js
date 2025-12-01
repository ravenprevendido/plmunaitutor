import { db } from '@/config/db';
import { studentProgressTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { quizId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("🔍 Fetching quiz progress for user:", userId, "quiz:", quizId);

    const progress = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.quiz_id, parseInt(quizId))
        )
      )
      .then(rows => rows[0]);

    if (!progress) {
      return NextResponse.json({ error: 'Progress not found' }, { status: 404 });
    }

    console.log("✅ Progress data found:", progress);
    return NextResponse.json(progress);

  } catch (error) {
    console.error('❌ Error fetching quiz progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}