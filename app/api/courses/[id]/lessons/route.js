import { db } from '@/config/db';
import { lessonsTable } from '@/config/schema';
import { eq, asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    console.log(`📖 Fetching lessons for course ID: ${id}`);
    
    // Select specific columns to avoid issues with missing lesson_type column
    const lessons = await db
      .select({
        id: lessonsTable.id,
        course_id: lessonsTable.course_id,
        title: lessonsTable.title,
        content: lessonsTable.content,
        video_url: lessonsTable.video_url,
        summary: lessonsTable.summary,
        key_concepts: lessonsTable.key_concepts,
        exercises: lessonsTable.exercises,
        duration: lessonsTable.duration,
        order_index: lessonsTable.order_index,
        created_at: lessonsTable.created_at,
        updated_at: lessonsTable.updated_at,
        // Try to include lesson_type, but it might not exist
      })
      .from(lessonsTable)
      .where(eq(lessonsTable.course_id, parseInt(id)))
      .orderBy(asc(lessonsTable.order_index));

    // Ensure backward compatibility - add lesson_type if missing
    const lessonsWithType = lessons.map(lesson => ({
      ...lesson,
      lesson_type: lesson.lesson_type || (lesson.video_url ? 'video' : 'text')
    }));

    console.log(`✅ Found ${lessonsWithType.length} lessons for course ${id}`);
    
    return NextResponse.json(lessonsWithType);
  } catch (error) {
    console.error('❌ Error fetching lessons:', error);
    // If error is about lesson_type column, try selecting without it
    if (error.message && error.message.includes('lesson_type')) {
      try {
        const { id } = await params;
        const lessons = await db
          .select({
            id: lessonsTable.id,
            course_id: lessonsTable.course_id,
            title: lessonsTable.title,
            content: lessonsTable.content,
            video_url: lessonsTable.video_url,
            summary: lessonsTable.summary,
            key_concepts: lessonsTable.key_concepts,
            exercises: lessonsTable.exercises,
            duration: lessonsTable.duration,
            order_index: lessonsTable.order_index,
            created_at: lessonsTable.created_at,
            updated_at: lessonsTable.updated_at,
          })
          .from(lessonsTable)
          .where(eq(lessonsTable.course_id, parseInt(id)))
          .orderBy(asc(lessonsTable.order_index));

        const lessonsWithType = lessons.map(lesson => ({
          ...lesson,
          lesson_type: lesson.video_url ? 'video' : 'text'
        }));

        return NextResponse.json(lessonsWithType);
      } catch (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const contentType = request.headers.get('content-type');
    
    let lessonData;
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle form data (for file uploads)
      const formData = await request.formData();
      lessonData = {
        title: formData.get('title'),
        content: formData.get('content'),
        video_url: formData.get('video_url'),
        summary: formData.get('summary'),
        key_concepts: formData.get('key_concepts') ? JSON.parse(formData.get('key_concepts')) : null,
        exercises: formData.get('exercises') ? JSON.parse(formData.get('exercises')) : null,
        duration: formData.get('duration') ? parseInt(formData.get('duration')) : null,
        order_index: formData.get('order_index') ? parseInt(formData.get('order_index')) : 0,
        status: formData.get('status') || 'published'
      };
    } else {
      // Handle JSON
      lessonData = await request.json();
    }

    console.log(`🆕 Creating lesson for course ${id}:`, lessonData);

    // Determine lesson type if not provided
    let lessonType = lessonData.lesson_type;
    if (!lessonType) {
      // Auto-detect: if video_url exists, it's a video lesson
      lessonType = lessonData.video_url ? 'video' : 'text';
    }

    // Build insert data - try with lesson_type first, fallback if column doesn't exist
    let insertData = {
      course_id: parseInt(id),
      title: lessonData.title,
      content: lessonData.content,
      video_url: lessonData.video_url,
      summary: lessonData.summary,
      key_concepts: lessonData.key_concepts,
      exercises: lessonData.exercises,
      duration: lessonData.duration,
      order_index: lessonData.order_index || 0,
    };

    // Try to insert with lesson_type, fallback if column doesn't exist
    let newLesson;
    try {
      insertData.lesson_type = lessonType;
      newLesson = await db
        .insert(lessonsTable)
        .values(insertData)
        .returning();
    } catch (error) {
      // If lesson_type column doesn't exist, insert without it
      if (error.message && error.message.includes('lesson_type')) {
        console.log('⚠️ lesson_type column not found, inserting without it');
        delete insertData.lesson_type;
        newLesson = await db
          .insert(lessonsTable)
          .values(insertData)
          .returning();
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    // Ensure lesson_type is in response (for backward compatibility)
    const lessonResponse = {
      ...newLesson[0],
      lesson_type: newLesson[0].lesson_type || lessonType
    };

    console.log("✅ Lesson created successfully:", lessonResponse);
    
    return NextResponse.json(lessonResponse, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating lesson:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}