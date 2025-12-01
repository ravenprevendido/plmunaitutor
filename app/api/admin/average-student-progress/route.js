import { db } from '@/config/db';
import { 
  enrollmentsTable, 
  coursesTable, 
  studentProgressTable, 
  lessonsTable, 
  quizzesTable, 
  assignmentsTable 
} from '@/config/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log("📊 Fetching average student progress for admin");

    // Get all courses
    const allCourses = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title,
      })
      .from(coursesTable);

    // Calculate progress for each course
    const coursesProgress = await Promise.all(
      allCourses.map(async (course) => {
        const courseId = course.id;

        // Get total items for this course
        const [lessons, quizzes, assignments] = await Promise.all([
          db.select().from(lessonsTable).where(eq(lessonsTable.course_id, courseId)),
          db.select().from(quizzesTable).where(eq(quizzesTable.course_id, courseId)),
          db.select().from(assignmentsTable).where(eq(assignmentsTable.course_id, courseId))
        ]);

        const totalItems = lessons.length + quizzes.length + assignments.length;

        if (totalItems === 0) {
          return {
            course_id: courseId,
            course_title: course.title,
            completed: 0,
            in_progress: 0,
            not_started: 0,
            total_students: 0,
          };
        }

        // Get all approved enrollments for this course
        const enrollments = await db
          .select({
            student_id: enrollmentsTable.student_id,
          })
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.course_id, courseId),
              eq(enrollmentsTable.status, 'approved')
            )
          );

        const totalStudents = enrollments.length;

        if (totalStudents === 0) {
          return {
            course_id: courseId,
            course_title: course.title,
            completed: 0,
            in_progress: 0,
            not_started: totalItems,
            total_students: 0,
          };
        }

        // Calculate progress for each student and aggregate
        let completedCount = 0;
        let inProgressCount = 0;
        let notStartedCount = 0;
        let totalProgressSum = 0;

        for (const enrollment of enrollments) {
          const studentId = enrollment.student_id;

          // Get completed items for this student in this course
          const completedProgress = await db
            .select()
            .from(studentProgressTable)
            .where(
              and(
                eq(studentProgressTable.student_id, studentId),
                eq(studentProgressTable.course_id, courseId),
                eq(studentProgressTable.completed, true)
              )
            );

          const completedItems = completedProgress.length;
          const progressPercentage = totalItems > 0 
            ? Math.round((completedItems / totalItems) * 100) 
            : 0;

          totalProgressSum += progressPercentage;

          if (progressPercentage === 100) {
            completedCount++;
          } else if (progressPercentage > 0) {
            inProgressCount++;
          } else {
            notStartedCount++;
          }
        }

        // Calculate average progress for this course
        const averageProgress = totalStudents > 0 
          ? Math.round(totalProgressSum / totalStudents) 
          : 0;

        return {
          course_id: courseId,
          course_title: course.title,
          completed: completedCount,
          in_progress: inProgressCount,
          not_started: notStartedCount,
          total_students: totalStudents,
          average_progress: averageProgress,
        };
      })
    );

    // Aggregate across all courses
    const totalCompleted = coursesProgress.reduce((sum, course) => sum + course.completed, 0);
    const totalInProgress = coursesProgress.reduce((sum, course) => sum + course.in_progress, 0);
    const totalNotStarted = coursesProgress.reduce((sum, course) => sum + course.not_started, 0);
    const totalStudents = coursesProgress.reduce((sum, course) => sum + course.total_students, 0);

    // Calculate percentages for donut chart
    const total = totalCompleted + totalInProgress + totalNotStarted;
    const completedPercent = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;
    const inProgressPercent = total > 0 ? Math.round((totalInProgress / total) * 100) : 0;
    const notStartedPercent = total > 0 ? Math.round((totalNotStarted / total) * 100) : 0;

    const result = {
      overall: {
        completed: completedPercent,
        in_progress: inProgressPercent,
        not_started: notStartedPercent,
        total_students: totalStudents,
      },
      by_course: coursesProgress,
    };

    console.log(`✅ Calculated progress for ${coursesProgress.length} courses`);
    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Average Student Progress API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

