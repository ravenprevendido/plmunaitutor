// app/api/study-plan/completed/route.js
import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { studyPlanTasksTable } from '@/config/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const completedTasks = await db
      .select()
      .from(studyPlanTasksTable)
      .where(
        and(
          eq(studyPlanTasksTable.user_id, userId),
          eq(studyPlanTasksTable.completed, true)
        )
      )
      .orderBy(desc(studyPlanTasksTable.completed_at));

    // Format the response
    const formattedTasks = completedTasks.map(task => ({
      id: task.id,
      text: task.task_text,
      subject: task.subject,
      estimatedTime: task.estimated_time,
      completed: task.completed,
      completedAt: task.completed_at,
      createdAt: task.created_at
    }));

    return NextResponse.json({ completedTasks: formattedTasks });
  } catch (error) {
    console.error('Error loading completed tasks:', error);
    return NextResponse.json({ error: 'Failed to load completed tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, task } = await request.json();

    if (!userId || !task) {
      return NextResponse.json({ error: 'User ID and task required' }, { status: 400 });
    }

    // Mark task as completed
    await db
      .update(studyPlanTasksTable)
      .set({
        completed: true,
        completed_at: new Date()
      })
      .where(
        and(
          eq(studyPlanTasksTable.user_id, userId),
          eq(studyPlanTasksTable.id, task.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving completed task:', error);
    return NextResponse.json({ error: 'Failed to save completed task' }, { status: 500 });
  }
}