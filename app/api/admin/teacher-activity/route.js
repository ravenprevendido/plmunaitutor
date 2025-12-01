// app/api/admin/teacher-activity/route.js
import { db } from '@/config/db';
import { teachersTable, coursesTable, lessonsTable, quizzesTable } from '@/config/schema';
import { eq, inArray, sql, count } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all active teachers
    const teachers = await db
      .select()
      .from(teachersTable)
      .where(eq(teachersTable.status, 'active'));

    // Get activity stats for each teacher
    const teacherActivity = await Promise.all(
      teachers.map(async (teacher) => {
        // Find all courses assigned to this teacher
        const teacherCourses = await db
          .select({ id: coursesTable.id })
          .from(coursesTable)
          .where(eq(coursesTable.assigned_teacher_id, teacher.email));

        const courseIds = teacherCourses.map(c => c.id);

        // Count lessons uploaded by this teacher
        let lessonsCount = 0;
        if (courseIds.length > 0) {
          const lessonsResult = await db
            .select({ count: count() })
            .from(lessonsTable)
            .where(inArray(lessonsTable.course_id, courseIds));
          
          lessonsCount = Number(lessonsResult[0]?.count) || 0;
        }

        // Count quizzes created by this teacher
        let quizzesCount = 0;
        if (courseIds.length > 0) {
          const quizzesResult = await db
            .select({ count: count() })
            .from(quizzesTable)
            .where(inArray(quizzesTable.course_id, courseIds));
          
          quizzesCount = Number(quizzesResult[0]?.count) || 0;
        }

        return {
          name: teacher.name,
          email: teacher.email,
          lessonsCount: Number(lessonsCount),
          quizzesCount: Number(quizzesCount),
          coursesCount: courseIds.length
        };
      })
    );

    // Sort by total activity (lessons + quizzes) descending
    teacherActivity.sort((a, b) => 
      (b.lessonsCount + b.quizzesCount) - (a.lessonsCount + a.quizzesCount)
    );

    // Find top performers
    const topLessonsTeacher = teacherActivity.length > 0 
      ? teacherActivity.reduce((max, teacher) => 
          teacher.lessonsCount > max.lessonsCount ? teacher : max, 
          teacherActivity[0]
        )
      : null;

    const topQuizzesTeacher = teacherActivity.length > 0
      ? teacherActivity.reduce((max, teacher) => 
          teacher.quizzesCount > max.quizzesCount ? teacher : max, 
          teacherActivity[0]
        )
      : null;

    return NextResponse.json({
      teachers: teacherActivity,
      topLessonsTeacher: topLessonsTeacher?.name || null,
      topQuizzesTeacher: topQuizzesTeacher?.name || null
    });
  } catch (error) {
    console.error('Error fetching teacher activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher activity data' },
      { status: 500 }
    );
  }
}

