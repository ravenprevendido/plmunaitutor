import { db } from '@/config/db';
import { 
  enrollmentsTable, 
  coursesTable, 
  studentProgressTable, 
  lessonsTable, 
  quizzesTable, 
  assignmentsTable 
} from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { studentId } = await params;
    
    console.log(`📊 Fetching detailed progress for student: ${studentId}`);

    // Get student info from enrollments
    const studentEnrollment = await db
      .select({
        student_id: enrollmentsTable.student_id,
        student_name: enrollmentsTable.student_name,
        student_email: enrollmentsTable.student_email,
      })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.student_id, studentId))
      .limit(1)
      .then(rows => rows[0]);

    if (!studentEnrollment) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get all approved enrollments for this student
    const enrollments = await db
      .select({
        enrollment_id: enrollmentsTable.id,
        course_id: enrollmentsTable.course_id,
        course_title: enrollmentsTable.course_title,
        progress: enrollmentsTable.progress,
        last_accessed: enrollmentsTable.last_accessed,
      })
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.student_id, studentId),
          eq(enrollmentsTable.status, 'approved')
        )
      );

    // Get detailed progress for each course
    const coursesWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.course_id;

        // Get total items for this course
        const [lessons, quizzes, assignments] = await Promise.all([
          db.select().from(lessonsTable).where(eq(lessonsTable.course_id, courseId)),
          db.select().from(quizzesTable).where(eq(quizzesTable.course_id, courseId)),
          db.select().from(assignmentsTable).where(eq(assignmentsTable.course_id, courseId))
        ]);

        const totalLessons = lessons.length;
        const totalQuizzes = quizzes.length;
        const totalAssignments = assignments.length;
        const totalItems = totalLessons + totalQuizzes + totalAssignments;

        // Get completed items
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

        const completedLessons = completedProgress.filter(p => p.lesson_id !== null).length;
        const completedQuizzes = completedProgress.filter(p => p.quiz_id !== null).length;
        const completedAssignments = completedProgress.filter(p => p.assignment_id !== null).length;
        const completedItems = completedProgress.length;

        const courseProgress = totalItems > 0 
          ? Math.round((completedItems / totalItems) * 100) 
          : 0;

        return {
          course_id: courseId,
          course_title: enrollment.course_title,
          progress: courseProgress,
          enrollment_progress: enrollment.progress || 0,
          last_accessed: enrollment.last_accessed,
          lessons: {
            total: totalLessons,
            completed: completedLessons,
            progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
          },
          quizzes: {
            total: totalQuizzes,
            completed: completedQuizzes,
            progress: totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0
          },
          assignments: {
            total: totalAssignments,
            completed: completedAssignments,
            progress: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
          },
          overall: {
            total: totalItems,
            completed: completedItems,
            progress: courseProgress
          }
        };
      })
    );

    // Calculate overall progress across all courses
    const overallProgress = coursesWithDetails.length > 0
      ? Math.round(coursesWithDetails.reduce((sum, course) => sum + course.progress, 0) / coursesWithDetails.length)
      : 0;

    return NextResponse.json({
      student: {
        id: studentEnrollment.student_id,
        name: studentEnrollment.student_name,
        email: studentEnrollment.student_email,
      },
      overall_progress: overallProgress,
      enrolled_courses: coursesWithDetails.length,
      courses: coursesWithDetails,
    });

  } catch (error) {
    console.error("❌ Student Progress API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

