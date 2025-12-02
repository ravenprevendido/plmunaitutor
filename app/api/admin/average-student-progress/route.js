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

    // REAL-TIME OVERALL COURSE COMPLETION RATE CALCULATION
    // Calculate based on actual course items (lessons, quizzes, assignments) completed vs total
    
    // Get all approved enrollments across all courses
    const allEnrollments = await db
      .select({
        student_id: enrollmentsTable.student_id,
        student_name: enrollmentsTable.student_name,
        student_email: enrollmentsTable.student_email,
        course_id: enrollmentsTable.course_id,
      })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.status, 'approved'));

    // Calculate total items across ALL courses
    let totalItemsAcrossAllCourses = 0;
    let totalCompletedItemsAcrossAllCourses = 0;
    let totalInProgressItemsAcrossAllCourses = 0;

    // Track student performance for top performers
    const studentPerformanceMap = new Map();

    // Process each course
    for (const course of allCourses) {
      const courseId = course.id;

      // Get total items for this course
      const [lessons, quizzes, assignments] = await Promise.all([
        db.select().from(lessonsTable).where(eq(lessonsTable.course_id, courseId)),
        db.select().from(quizzesTable).where(eq(quizzesTable.course_id, courseId)),
        db.select().from(assignmentsTable).where(eq(assignmentsTable.course_id, courseId))
      ]);

      const totalItems = lessons.length + quizzes.length + assignments.length;
      totalItemsAcrossAllCourses += totalItems;

      if (totalItems === 0) continue;

      // Get all students enrolled in this course
      const courseEnrollments = allEnrollments.filter(e => e.course_id === courseId);

      // Track student enrollments for later performance calculation
      for (const enrollment of courseEnrollments) {
        const studentId = enrollment.student_id;
        if (!studentPerformanceMap.has(studentId)) {
          studentPerformanceMap.set(studentId, {
            student_id: studentId,
            student_name: enrollment.student_name,
            student_email: enrollment.student_email,
            total_items: 0,
            completed_items: 0,
            enrolled_courses: new Set()
          });
        }
        const studentData = studentPerformanceMap.get(studentId);
        studentData.total_items += totalItems;
        studentData.enrolled_courses.add(courseId);
      }
    }

    // OPTIMIZED: Get all progress records at once (much more efficient)
    const allProgressRecords = await db
      .select({
        student_id: studentProgressTable.student_id,
        course_id: studentProgressTable.course_id,
        completed: studentProgressTable.completed,
      })
      .from(studentProgressTable);

    // Calculate completed items for each student using the fetched records
    allProgressRecords.forEach(progress => {
      if (progress.completed === true && studentPerformanceMap.has(progress.student_id)) {
        const studentData = studentPerformanceMap.get(progress.student_id);
        studentData.completed_items += 1;
      }
    });

    // Count completed and in-progress items
    const totalCompletedItemInstances = allProgressRecords.filter(p => p.completed === true).length;
    const totalInProgressItemInstances = allProgressRecords.filter(p => p.completed === false).length;

    // Calculate total possible item instances correctly
    // For each course: (total items in course) * (number of students enrolled in that course)
    let totalPossibleItemInstances = 0;
    const courseEnrollmentCounts = new Map();
    
    // Count enrollments per course
    allEnrollments.forEach(enrollment => {
      const count = courseEnrollmentCounts.get(enrollment.course_id) || 0;
      courseEnrollmentCounts.set(enrollment.course_id, count + 1);
    });

    // Calculate total possible instances
    for (const course of allCourses) {
      const courseId = course.id;
      const [lessons, quizzes, assignments] = await Promise.all([
        db.select().from(lessonsTable).where(eq(lessonsTable.course_id, courseId)),
        db.select().from(quizzesTable).where(eq(quizzesTable.course_id, courseId)),
        db.select().from(assignmentsTable).where(eq(assignmentsTable.course_id, courseId))
      ]);
      const totalItems = lessons.length + quizzes.length + assignments.length;
      const enrolledStudents = courseEnrollmentCounts.get(courseId) || 0;
      totalPossibleItemInstances += totalItems * enrolledStudents;
    }

    // Calculate percentages based on actual completion
    const completedPercent = totalPossibleItemInstances > 0
      ? Math.round((totalCompletedItemInstances / totalPossibleItemInstances) * 100)
      : 0;

    const inProgressPercent = totalPossibleItemInstances > 0
      ? Math.round((totalInProgressItemInstances / totalPossibleItemInstances) * 100)
      : 0;

    // Calculate individual student overall progress for top performers
    const topPerformers = Array.from(studentPerformanceMap.values())
      .map(student => {
        const overallProgress = student.total_items > 0
          ? Math.round((student.completed_items / student.total_items) * 100)
          : 0;
        return {
          student_id: student.student_id,
          student_name: student.student_name,
          student_email: student.student_email,
          overall_progress: overallProgress,
          completed_items: student.completed_items,
          total_items: student.total_items,
          enrolled_courses_count: student.enrolled_courses.size
        };
      })
      .filter(student => student.total_items > 0) // Only students with enrolled courses
      .sort((a, b) => b.overall_progress - a.overall_progress)
      .slice(0, 10); // Top 10 students

    const result = {
      overall: {
        completed: completedPercent,
        in_progress: inProgressPercent,
        total_completed_items: totalCompletedItemInstances,
        total_in_progress_items: totalInProgressItemInstances,
        total_possible_items: totalPossibleItemInstances,
        total_students: allEnrollments.length,
      },
      top_performers: topPerformers,
      by_course: coursesProgress,
    };

    console.log(`✅ Calculated real-time progress: ${completedPercent}% completed, ${inProgressPercent}% in progress`);
    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Average Student Progress API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

