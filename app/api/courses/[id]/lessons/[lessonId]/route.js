import { db } from '@/config/db';
import { lessonsTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id, lessonId } = await params;
    
    console.log(`📖 Fetching lesson ${lessonId} from course ${id}`);
    
    const lesson = await db
      .select()
      .from(lessonsTable)
      .where(
        and(
          eq(lessonsTable.id, parseInt(lessonId)),
          eq(lessonsTable.course_id, parseInt(id))
        )
      )
      .then(rows => rows[0]);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Ensure backward compatibility - add lesson_type if missing
    const lessonWithType = {
      ...lesson,
      lesson_type: lesson.lesson_type || (lesson.video_url ? 'video' : 'text')
    };

    console.log("✅ Lesson found:", lessonWithType);
    return NextResponse.json(lessonWithType);

  } catch (error) {
    console.error("❌ GET Lesson Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}