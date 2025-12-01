// app/api/study-plan/route.js
import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { studyPlansTable, studyPlanTasksTable } from '@/config/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    // Get the latest study plan for the user
    const studyPlan = await db
      .select()
      .from(studyPlansTable)
      .where(eq(studyPlansTable.user_id, userId))
      .orderBy(desc(studyPlansTable.generated_at))
      .limit(1);

    if (studyPlan.length === 0) {
      return NextResponse.json({ studyPlan: null });
    }

    // Get all tasks for this study plan
    const tasks = await db
      .select()
      .from(studyPlanTasksTable)
      .where(eq(studyPlanTasksTable.study_plan_id, studyPlan[0].id));

    // Organize tasks by day
    const weeklySchedule = studyPlan[0].weekly_schedule || [];
    const tasksByDay = {};
    
    tasks.forEach(task => {
      if (!tasksByDay[task.day]) {
        tasksByDay[task.day] = [];
      }
      tasksByDay[task.day].push({
        id: task.id,
        text: task.task_text,
        subject: task.subject,
        estimatedTime: task.estimated_time,
        completed: task.completed,
        createdAt: task.created_at
      });
    });

    // Merge with weekly schedule
    const enhancedSchedule = weeklySchedule.map(day => ({
      ...day,
      tasks: tasksByDay[day.day] || []
    }));

    return NextResponse.json({ 
      studyPlan: {
        id: studyPlan[0].id,
        recommendation: studyPlan[0].recommendation,
        focusAreas: studyPlan[0].focus_areas,
        weeklySchedule: enhancedSchedule,
        generatedAt: studyPlan[0].generated_at
      }
    });
  } catch (error) {
    console.error('Error loading study plan:', error);
    return NextResponse.json({ error: 'Failed to load study plan' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, studyPlan } = await request.json();

    if (!userId || !studyPlan) {
      return NextResponse.json({ error: 'User ID and study plan required' }, { status: 400 });
    }

    // REMOVED TRANSACTION - Direct sequential operations
    // Create new study plan
    const [newStudyPlan] = await db
      .insert(studyPlansTable)
      .values({
        user_id: userId,
        recommendation: studyPlan.recommendation,
        focus_areas: studyPlan.focusAreas,
        weekly_schedule: studyPlan.weeklySchedule,
      })
      .returning();

    // Create tasks for each day
    const tasksToInsert = [];
    studyPlan.weeklySchedule.forEach(day => {
      day.tasks.forEach(task => {
        tasksToInsert.push({
          study_plan_id: newStudyPlan.id,
          user_id: userId,
          task_text: task.text,
          subject: task.subject,
          estimated_time: task.estimatedTime,
          day: day.day,
          date: day.date,
          completed: task.completed || false,
        });
      });
    });

    if (tasksToInsert.length > 0) {
      await db.insert(studyPlanTasksTable).values(tasksToInsert);
    }

    // Return the created study plan with tasks
    const createdTasks = await db
      .select()
      .from(studyPlanTasksTable)
      .where(eq(studyPlanTasksTable.study_plan_id, newStudyPlan.id));

    const tasksByDay = {};
    createdTasks.forEach(task => {
      if (!tasksByDay[task.day]) {
        tasksByDay[task.day] = [];
      }
      tasksByDay[task.day].push({
        id: task.id,
        text: task.task_text,
        subject: task.subject,
        estimatedTime: task.estimated_time,
        completed: task.completed,
        createdAt: task.created_at
      });
    });

    const enhancedSchedule = studyPlan.weeklySchedule.map(day => ({
      ...day,
      tasks: tasksByDay[day.day] || []
    }));

    const result = {
      id: newStudyPlan.id,
      recommendation: newStudyPlan.recommendation,
      focusAreas: newStudyPlan.focus_areas,
      weeklySchedule: enhancedSchedule,
      generatedAt: newStudyPlan.generated_at
    };

    return NextResponse.json({ 
      success: true, 
      studyPlan: result 
    });
  } catch (error) {
    console.error('Error saving study plan:', error);
    return NextResponse.json({ error: 'Failed to save study plan' }, { status: 500 });
  }
}