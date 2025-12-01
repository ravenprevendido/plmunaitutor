// app/api/teacher/lesson-completion-rate/route.js
import { db } from '@/config/db';
import { 
  coursesTable, 
  lessonsTable,
  studentProgressTable,
  enrollmentsTable,
  usersTable
} from '@/config/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📊 Fetching lesson completion rate for teacher:", userId);

    // Get teacher's email
    const teacher = await db
      .select({
        email: usersTable.email
      })
      .from(usersTable)
      .where(eq(usersTable.clerk_id, userId))
      .then(rows => rows[0]);

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const teacherEmail = teacher.email;

    // Get teacher's courses
    const teacherCourses = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title
      })
      .from(coursesTable)
      .where(eq(coursesTable.assigned_teacher_id, teacherEmail));

    if (teacherCourses.length === 0) {
      return NextResponse.json([]);
    }

    const courseIds = teacherCourses.map(course => course.id);

    // Calculate completion rate for each course
    const completionData = await Promise.all(
      teacherCourses.map(async (course) => {
        // Get total lessons for this course
        const totalLessons = await db
          .select({ count: count() })
          .from(lessonsTable)
          .where(eq(lessonsTable.course_id, course.id));

        const totalLessonsCount = totalLessons[0]?.count || 0;

        // Get enrolled students for this course
        const enrolledStudents = await db
          .select({ count: count(sql`DISTINCT ${enrollmentsTable.student_id}`) })
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.course_id, course.id),
              eq(enrollmentsTable.status, 'approved')
            )
          );

        const enrolledCount = enrolledStudents[0]?.count || 0;

        if (enrolledCount === 0 || totalLessonsCount === 0) {
          return {
            name: course.title,
            Completed: 0,
            "In Progress": 0
          };
        }

        // Get completed lessons (students who completed all lessons)
        const completedProgress = await db
          .select({
            student_id: studentProgressTable.student_id
          })
          .from(studentProgressTable)
          .where(
            and(
              eq(studentProgressTable.course_id, course.id),
              eq(studentProgressTable.completed, true),
              sql`${studentProgressTable.lesson_id} IS NOT NULL`
            )
          );

        // Count unique students who completed all lessons
        const studentsCompletedAll = new Set(
          completedProgress
            .filter(p => p.student_id)
            .map(p => p.student_id)
        );

        // Count students who started but didn't complete all lessons
        const inProgressProgress = await db
          .select({
            student_id: studentProgressTable.student_id
          })
          .from(studentProgressTable)
          .where(
            and(
              eq(studentProgressTable.course_id, course.id),
              eq(studentProgressTable.completed, false),
              sql`${studentProgressTable.lesson_id} IS NOT NULL`
            )
          );

        const studentsInProgress = new Set(
          inProgressProgress
            .filter(p => p.student_id)
            .map(p => p.student_id)
        );

        // Calculate percentages
        const completedPercentage = Math.round((studentsCompletedAll.size / enrolledCount) * 100);
        const inProgressPercentage = Math.round((studentsInProgress.size / enrolledCount) * 100);

        return {
          name: course.title,
          Completed: completedPercentage,
          "In Progress": inProgressPercentage
        };
      })
    );

    return NextResponse.json(completionData);

  } catch (error) {
    console.error('❌ Error fetching lesson completion rate:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

