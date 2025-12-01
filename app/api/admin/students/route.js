import { db } from '@/config/db';
import { enrollmentsTable, usersTable, coursesTable, studentProgressTable, lessonsTable, quizzesTable, assignmentsTable } from '@/config/schema';
import { eq, and, sql, or, isNotNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log("📚 Fetching all students for admin");

    // Get all unique students from enrollments
    const enrollments = await db
      .select({
        student_id: enrollmentsTable.student_id,
        student_name: enrollmentsTable.student_name,
        student_email: enrollmentsTable.student_email,
        status: enrollmentsTable.status,
      })
      .from(enrollmentsTable)
      .groupBy(
        enrollmentsTable.student_id,
        enrollmentsTable.student_name,
        enrollmentsTable.student_email,
        enrollmentsTable.status
      );

    // Get unique students
    const uniqueStudents = {};
    enrollments.forEach(enrollment => {
      if (!uniqueStudents[enrollment.student_id]) {
        uniqueStudents[enrollment.student_id] = {
          id: enrollment.student_id,
          name: enrollment.student_name,
          email: enrollment.student_email,
          status: enrollment.status === 'approved' ? 'active' : 'deactivated',
        };
      }
    });

    const students = Object.values(uniqueStudents);

    // For each student, get their enrollments and calculate progress
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        // Get all enrollments for this student
        const studentEnrollments = await db
          .select()
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.student_id, student.id),
              eq(enrollmentsTable.status, 'approved')
            )
          );

        const enrolledCoursesCount = studentEnrollments.length;

        // Calculate overall progress across all courses
        let totalProgress = 0;
        let coursesWithProgress = 0;

        for (const enrollment of studentEnrollments) {
          const courseId = enrollment.course_id;
          
          // Get total items (lessons + quizzes + assignments) for this course
          const [lessons, quizzes, assignments] = await Promise.all([
            db.select().from(lessonsTable).where(eq(lessonsTable.course_id, courseId)),
            db.select().from(quizzesTable).where(eq(quizzesTable.course_id, courseId)),
            db.select().from(assignmentsTable).where(eq(assignmentsTable.course_id, courseId))
          ]);

          const totalItems = lessons.length + quizzes.length + assignments.length;

          if (totalItems > 0) {
            // Get completed items for this course
            const completedProgress = await db
              .select()
              .from(studentProgressTable)
              .where(
                and(
                  eq(studentProgressTable.student_id, student.id),
                  eq(studentProgressTable.course_id, courseId),
                  eq(studentProgressTable.completed, true)
                )
              );

            const completedCount = completedProgress.length;
            const courseProgress = Math.round((completedCount / totalItems) * 100);
            
            totalProgress += courseProgress;
            coursesWithProgress++;
          }
        }

        // Calculate average progress
        const averageProgress = coursesWithProgress > 0 
          ? Math.round(totalProgress / coursesWithProgress) 
          : studentEnrollments[0]?.progress || 0;

        return {
          ...student,
          enrolledCourses: enrolledCoursesCount,
          progress: averageProgress,
        };
      })
    );

    console.log(`✅ Found ${studentsWithProgress.length} students`);
    return NextResponse.json(studentsWithProgress);

  } catch (error) {
    console.error("❌ Admin Students API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

