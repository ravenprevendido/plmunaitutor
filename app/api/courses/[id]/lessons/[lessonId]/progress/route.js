import { db } from '@/config/db';
import { studentProgressTable, lessonsTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// GET lesson progress for student
export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { id, lessonId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get lesson details
    const lesson = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, parseInt(lessonId)))
      .then(rows => rows[0]);

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Get student progress
    const progress = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.course_id, parseInt(id)),
          eq(studentProgressTable.lesson_id, parseInt(lessonId))
        )
      )
      .then(rows => rows[0]);

    // Calculate completion percentage
    let completionPercentage = 0;
    if (progress?.completed) {
      completionPercentage = 100;
    } else if (progress?.answers) {
      // Calculate based on exercises completed
      const exercises = lesson.exercises || [];
      const completedExercises = progress.answers.completed_exercises || [];
      if (exercises.length > 0) {
        completionPercentage = Math.round((completedExercises.length / exercises.length) * 100);
      }
    }

    return NextResponse.json({
      lesson_id: parseInt(lessonId),
      completed: progress?.completed || false,
      completion_percentage: completionPercentage,
      completed_exercises: progress?.answers?.completed_exercises || [],
      video_watched: progress?.answers?.video_watched || false,
      last_accessed: progress?.submitted_at || null
    });

  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST/UPDATE lesson progress
export async function POST(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { id, lessonId } = await params;
    const { video_watched, completed_exercise_id, completed } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing progress
    const existingProgress = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.course_id, parseInt(id)),
          eq(studentProgressTable.lesson_id, parseInt(lessonId))
        )
      )
      .then(rows => rows[0]);

    const answers = existingProgress?.answers || {};
    
    // Update answers
    if (video_watched !== undefined) {
      answers.video_watched = video_watched;
    }
    
    if (completed_exercise_id !== undefined && completed_exercise_id !== null) {
      if (!answers.completed_exercises) {
        answers.completed_exercises = [];
      }
      // Handle both numeric IDs and index-based IDs
      const exerciseId = typeof completed_exercise_id === 'number' 
        ? completed_exercise_id 
        : parseInt(completed_exercise_id);
      
      if (!answers.completed_exercises.includes(exerciseId)) {
        answers.completed_exercises.push(exerciseId);
      }
    }

    // Get lesson to check total exercises
    const lesson = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, parseInt(lessonId)))
      .then(rows => rows[0]);

    const totalExercises = lesson?.exercises?.length || 0;
    const completedExercises = answers.completed_exercises?.length || 0;
    
    // Auto-complete if all exercises done and video watched
    const shouldComplete = completed || (
      totalExercises > 0 && 
      completedExercises >= totalExercises && 
      answers.video_watched
    );

    if (existingProgress) {
      // Update existing progress
      const updated = await db
        .update(studentProgressTable)
        .set({
          answers,
          completed: shouldComplete,
          submitted_at: new Date()
        })
        .where(eq(studentProgressTable.id, existingProgress.id))
        .returning();

      return NextResponse.json({
        success: true,
        progress: updated[0],
        completion_percentage: shouldComplete ? 100 : Math.round((completedExercises / totalExercises) * 100)
      });
    } else {
      // Create new progress
      const newProgress = await db
        .insert(studentProgressTable)
        .values({
          student_id: userId,
          course_id: parseInt(id),
          lesson_id: parseInt(lessonId),
          completed: shouldComplete,
          answers,
          submitted_at: new Date()
        })
        .returning();

      return NextResponse.json({
        success: true,
        progress: newProgress[0],
        completion_percentage: shouldComplete ? 100 : Math.round((completedExercises / totalExercises) * 100)
      });
    }

  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

