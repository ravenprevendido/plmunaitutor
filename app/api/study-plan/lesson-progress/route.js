// app/api/study-plan/lesson-progress/route.js
import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { lessonProgressTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const taskId = searchParams.get('taskId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const whereClause = taskId 
      ? and(
          eq(lessonProgressTable.user_id, userId),
          eq(lessonProgressTable.task_id, parseInt(taskId))
        )
      : eq(lessonProgressTable.user_id, userId);

    const progress = await db
      .select()
      .from(lessonProgressTable)
      .where(whereClause);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error loading lesson progress:', error);
    return NextResponse.json({ error: 'Failed to load lesson progress' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, taskId, subject, currentPage, totalPages, completed } = await request.json();

    if (!userId || !taskId) {
      return NextResponse.json({ error: 'User ID and task ID required' }, { status: 400 });
    }

    // Check if progress already exists
    const existingProgress = await db
      .select()
      .from(lessonProgressTable)
      .where(
        and(
          eq(lessonProgressTable.user_id, userId),
          eq(lessonProgressTable.task_id, taskId)
        )
      )
      .limit(1);

    if (existingProgress.length > 0) {
      // Update existing progress
      const [updatedProgress] = await db
        .update(lessonProgressTable)
        .set({
          current_page: currentPage,
          completed: completed || false,
          last_accessed: new Date(),
          completed_at: completed ? new Date() : null
        })
        .where(eq(lessonProgressTable.id, existingProgress[0].id))
        .returning();

      return NextResponse.json({ success: true, progress: updatedProgress });
    } else {
      // Create new progress
      const [newProgress] = await db
        .insert(lessonProgressTable)
        .values({
          user_id: userId,
          task_id: taskId,
          subject: subject,
          current_page: currentPage || 0,
          total_pages: totalPages || 7,
          completed: completed || false,
          started_at: new Date()
        })
        .returning();

      return NextResponse.json({ success: true, progress: newProgress });
    }
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    return NextResponse.json({ error: 'Failed to save lesson progress' }, { status: 500 });
  }
}