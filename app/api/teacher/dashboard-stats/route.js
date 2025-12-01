// app/api/teacher/dashboard-stats/route.js (Updated with usersTable import)
import { db } from '@/config/db';
import { 
  coursesTable, 
  enrollmentsTable, 
  assignmentsTable, 
  studentProgressTable,
  quizzesTable,
  usersTable  // Make sure to import usersTable
} from '@/config/schema';
import { eq, and, count, sql, avg } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📊 Fetching teacher dashboard stats for user:", userId);

    // Get teacher's email from users table
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

    // 1. Total Courses - courses assigned to this teacher
    const totalCoursesResult = await db
      .select({ count: count() })
      .from(coursesTable)
      .where(eq(coursesTable.assigned_teacher_id, teacherEmail));

    const totalCourses = totalCoursesResult[0]?.count || 0;

    // 2. Enrolled Students - count unique students in teacher's courses
    const enrolledStudentsResult = await db
      .select({ 
        count: count(sql`DISTINCT ${enrollmentsTable.student_id}`)
      })
      .from(enrollmentsTable)
      .innerJoin(coursesTable, eq(enrollmentsTable.course_id, coursesTable.id))
      .where(
        and(
          eq(coursesTable.assigned_teacher_id, teacherEmail),
          eq(enrollmentsTable.status, 'approved')
        )
      );

    const enrolledStudents = enrolledStudentsResult[0]?.count || 0;

    // 3. Pending Assignments - assignments not completed by students
    const pendingAssignmentsResult = await db
      .select({ 
        count: count(sql`DISTINCT ${assignmentsTable.id}`)
      })
      .from(assignmentsTable)
      .innerJoin(coursesTable, eq(assignmentsTable.course_id, coursesTable.id))
      .leftJoin(
        studentProgressTable, 
        and(
          eq(studentProgressTable.assignment_id, assignmentsTable.id),
          eq(studentProgressTable.completed, true)
        )
      )
      .where(
        and(
          eq(coursesTable.assigned_teacher_id, teacherEmail),
          sql`${studentProgressTable.id} IS NULL` // No completed progress record
        )
      );

    const pendingAssignments = pendingAssignmentsResult[0]?.count || 0;

    // 4. Average Quiz Score - average of all quiz scores in teacher's courses
    const averageQuizScoreResult = await db
      .select({ 
        average: avg(studentProgressTable.score) 
      })
      .from(studentProgressTable)
      .innerJoin(quizzesTable, eq(studentProgressTable.quiz_id, quizzesTable.id))
      .innerJoin(coursesTable, eq(quizzesTable.course_id, coursesTable.id))
      .where(
        and(
          eq(coursesTable.assigned_teacher_id, teacherEmail),
          eq(studentProgressTable.completed, true),
          sql`${studentProgressTable.score} IS NOT NULL`
        )
      );

    const averageQuizScore = averageQuizScoreResult[0]?.average 
      ? Math.round(parseFloat(averageQuizScoreResult[0].average)) 
      : 0;

    // Calculate trends based on current data
    const stats = {
      totalCourses: {
        count: totalCourses,
        trend: totalCourses > 0 ? `${totalCourses} active courses` : 'No courses assigned',
        description: 'Courses you are teaching'
      },
      enrolledStudents: {
        count: enrolledStudents,
        trend: enrolledStudents > 0 ? `${enrolledStudents} total students` : 'No enrolled students',
        description: 'Students in your courses'
      },
      pendingAssignments: {
        count: pendingAssignments,
        trend: pendingAssignments > 0 ? `${pendingAssignments} need grading` : 'All caught up',
        description: 'Assignments needing review'
      },
      averageQuizScore: {
        count: averageQuizScore,
        trend: averageQuizScore >= 80 ? 'Excellent performance' : 
               averageQuizScore >= 60 ? 'Good performance' : 'Needs improvement',
        description: 'Student quiz performance'
      }
    };

    console.log("✅ Teacher dashboard stats:", stats);
    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Error fetching teacher dashboard stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}