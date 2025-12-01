import { db } from '@/config/db';
import { studentProgressTable, enrollmentsTable, lessonsTable, quizzesTable, assignmentsTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const course_id = searchParams.get('course_id');
    const assignment_id = searchParams.get('assignment_id');

    if (!course_id || !assignment_id) {
      return NextResponse.json({ error: 'Course ID and Assignment ID are required' }, { status: 400 });
    }

    const progress = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.course_id, parseInt(course_id)),
          eq(studentProgressTable.assignment_id, parseInt(assignment_id))
        )
      )
      .then(rows => rows[0]);

    return NextResponse.json(progress || null);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if request is FormData (for file uploads) or JSON
    const contentType = request.headers.get('content-type');
    let course_id, lesson_id, quiz_id, assignment_id, completed, score, answers, submissionFile;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      course_id = formData.get('course_id');
      lesson_id = formData.get('lesson_id');
      quiz_id = formData.get('quiz_id');
      assignment_id = formData.get('assignment_id');
      completed = formData.get('completed') === 'true';
      score = formData.get('score') ? parseInt(formData.get('score')) : null;
      const answersStr = formData.get('answers');
      answers = answersStr ? JSON.parse(answersStr) : null;
      submissionFile = formData.get('submission_file');
    } else {
      const body = await request.json();
      course_id = body.course_id;
      lesson_id = body.lesson_id;
      quiz_id = body.quiz_id;
      assignment_id = body.assignment_id;
      completed = body.completed;
      score = body.score;
      answers = body.answers;
    }

    console.log("📝 Student progress update:", {
      userId,
      course_id,
      lesson_id,
      quiz_id,
      assignment_id,
      completed,
      score
    });

    // Validate required fields
    if (!course_id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if progress record already exists
    // Build the where clause based on what type of item this is
    const whereConditions = [
      eq(studentProgressTable.student_id, userId),
      eq(studentProgressTable.course_id, parseInt(course_id))
    ];

    if (quiz_id) {
      whereConditions.push(eq(studentProgressTable.quiz_id, parseInt(quiz_id)));
    } else if (lesson_id) {
      whereConditions.push(eq(studentProgressTable.lesson_id, parseInt(lesson_id)));
    } else if (assignment_id) {
      whereConditions.push(eq(studentProgressTable.assignment_id, parseInt(assignment_id)));
    }

    const existingProgress = await db
      .select()
      .from(studentProgressTable)
      .where(and(...whereConditions))
      .then(rows => rows[0]);

    // Handle file upload for assignments
    let submissionFileUrl = null;
    if (submissionFile && submissionFile instanceof File && assignment_id) {
      const bytes = await submissionFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'submissions');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${userId}-${assignment_id}-${timestamp}-${submissionFile.name}`;
      const filepath = join(uploadsDir, filename);

      // Save file
      await writeFile(filepath, buffer);

      // Store URL path (relative to public folder)
      submissionFileUrl = `/uploads/submissions/${filename}`;
    }

    let result;

    if (existingProgress) {
      // Update existing progress - always update if new submission
      const updateData = {
        completed: completed !== undefined ? completed : existingProgress.completed,
        score: score !== undefined ? score : existingProgress.score,
        submitted_at: new Date()
      };

      if (answers) {
        updateData.answers = answers;
      }

      if (submissionFileUrl) {
        updateData.answers = {
          ...(existingProgress.answers || {}),
          answer: answers?.answer || existingProgress.answers?.answer || '',
          submission_file: submissionFileUrl
        };
      }

      result = await db
        .update(studentProgressTable)
        .set(updateData)
        .where(eq(studentProgressTable.id, existingProgress.id))
        .returning();
    } else {
      // Create new progress record
      const insertData = {
        student_id: userId,
        course_id: parseInt(course_id),
        lesson_id: lesson_id ? parseInt(lesson_id) : null,
        quiz_id: quiz_id ? parseInt(quiz_id) : null,
        assignment_id: assignment_id ? parseInt(assignment_id) : null,
        completed: completed !== undefined ? completed : true,
        score: score !== undefined ? score : null,
        submitted_at: new Date()
      };

      if (answers) {
        insertData.answers = answers;
      }

      if (submissionFileUrl) {
        insertData.answers = {
          answer: answers?.answer || '',
          submission_file: submissionFileUrl
        };
      }

      result = await db
        .insert(studentProgressTable)
        .values(insertData)
        .returning();
    }

    console.log("✅ Progress updated successfully:", result[0]);

    // Update enrollment progress for any completion (lesson, quiz, or assignment)
    if (completed && !existingProgress?.completed) {
      await updateEnrollmentProgress(userId, parseInt(course_id));
    }

    return NextResponse.json(result[0]);

  } catch (error) {
    console.error('❌ Error updating student progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function updateEnrollmentProgress(studentId, courseId) {
  try {
    // Calculate overall progress including lessons, quizzes, and assignments
    const progressRecords = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, studentId),
          eq(studentProgressTable.course_id, courseId),
          eq(studentProgressTable.completed, true)
        )
      );

    // Get total counts of all items
    const [totalLessons, totalQuizzes, totalAssignments] = await Promise.all([
      db
        .select()
        .from(lessonsTable)
        .where(eq(lessonsTable.course_id, courseId))
        .then(rows => rows.length),
      
      db
        .select()
        .from(quizzesTable)
        .where(eq(quizzesTable.course_id, courseId))
        .then(rows => rows.length),
      
      db
        .select()
        .from(assignmentsTable)
        .where(eq(assignmentsTable.course_id, courseId))
        .then(rows => rows.length)
    ]);

    const totalItems = totalLessons + totalQuizzes + totalAssignments;
    const completedItems = progressRecords.length;

    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Update enrollment progress
    await db
      .update(enrollmentsTable)
      .set({
        progress,
        last_accessed: new Date()
      })
      .where(
        and(
          eq(enrollmentsTable.student_id, studentId),
          eq(enrollmentsTable.course_id, courseId)
        )
      );

    console.log(`📊 Updated progress for student ${studentId}: ${progress}% (${completedItems}/${totalItems} items)`);

  } catch (error) {
    console.error('Error updating enrollment progress:', error);
  }
}

// REMOVED THE DUPLICATE POST FUNCTION - Only one POST function should exist