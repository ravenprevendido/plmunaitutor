import { db } from '@/config/db';
import { 
  enrollmentsTable, 
  lessonsTable, 
  coursesTable, 
  studentProgressTable 
} from '@/config/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📚 Fetching all lesson materials for student:", userId);

    // Get student's enrolled courses (only approved enrollments)
    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.student_id, userId),
          eq(enrollmentsTable.status, 'approved')
        )
      );

    if (enrollments.length === 0) {
      return NextResponse.json([]);
    }

    const courseIds = enrollments.map(enrollment => enrollment.course_id);

    // Get all lessons from enrolled courses
    // Use select() to get all columns, then map to handle missing lesson_type
    const allLessonsRaw = await db
      .select()
      .from(lessonsTable)
      .innerJoin(coursesTable, eq(lessonsTable.course_id, coursesTable.id))
      .where(inArray(lessonsTable.course_id, courseIds))
      .orderBy(lessonsTable.order_index);

    // Map to extract needed fields and handle missing lesson_type
    const allLessons = allLessonsRaw.map(row => {
      const lesson = row.lessons || row;
      const course = row.courses || {};
      
      // Handle both join structure and direct select
      const lessonData = lesson.id ? lesson : row;
      const courseData = course.title ? course : {};
      
      return {
        id: lessonData.id,
        title: lessonData.title,
        content: lessonData.content,
        video_url: lessonData.video_url,
        lesson_type: lessonData.lesson_type || (lessonData.video_url ? 'video' : 'text'),
        course_id: lessonData.course_id,
        course_title: courseData.title || 'Unknown Course',
        order_index: lessonData.order_index,
        created_at: lessonData.created_at,
      };
    });

    // Get progress for all lessons (only if there are lessons)
    // Use studentProgressTable which has lesson_id
    let progressRecords = [];
    if (allLessons.length > 0) {
      const lessonIds = allLessons.map(l => l.id);
      if (lessonIds.length > 0) {
        try {
          progressRecords = await db
            .select()
            .from(studentProgressTable)
            .where(
              and(
                eq(studentProgressTable.student_id, userId),
                inArray(studentProgressTable.lesson_id, lessonIds)
              )
            );
        } catch (progressError) {
          console.error('Error fetching progress records:', progressError);
          progressRecords = [];
        }
      }
    }

    // Create a map of lesson progress
    const progressMap = {};
    progressRecords.forEach(progress => {
      progressMap[progress.lesson_id] = progress;
    });

    // Combine lesson data with progress and determine viewed status
    const lessonsWithProgress = allLessons.map(lesson => {
      const progress = progressMap[lesson.id];
      // Check if lesson is viewed based on progress
      const isViewed = progress ? (
        progress.completed === true || 
        (progress.answers && progress.answers.video_watched === true) ||
        (progress.answers && progress.answers.completed_exercises && progress.answers.completed_exercises.length > 0)
      ) : false;

      // Determine lesson type icon
      // Priority: video_url > lesson_type === 'practice' > text
      let lessonType = 'text';
      if (lesson.video_url && lesson.video_url.trim() !== '') {
        lessonType = 'video';
      } else if (lesson.lesson_type === 'practice') {
        lessonType = 'practice';
      } else {
        lessonType = 'text';
      }

      return {
        id: lesson.id,
        title: lesson.title,
        courseTitle: lesson.course_title,
        courseId: lesson.course_id,
        lessonType: lessonType,
        status: isViewed ? 'viewed' : 'not_viewed',
        progress: progress || null,
        order_index: lesson.order_index,
        created_at: lesson.created_at,
      };
    });

    // Sort by course, then by order_index
    lessonsWithProgress.sort((a, b) => {
      if (a.courseTitle !== b.courseTitle) {
        return a.courseTitle.localeCompare(b.courseTitle);
      }
      return (a.order_index || 0) - (b.order_index || 0);
    });

    console.log(`✅ Found ${lessonsWithProgress.length} lessons for student`);
    return NextResponse.json(lessonsWithProgress);

  } catch (error) {
    console.error("❌ Lesson Materials API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

