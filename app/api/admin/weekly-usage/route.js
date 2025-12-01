// app/api/admin/weekly-usage/route.js
import { db } from '@/config/db';
import { usersTable, enrollmentsTable, coursesTable, lessonsTable, quizzesTable } from '@/config/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get current week dates (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDay + 1); // Monday
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Sunday
    endDate.setHours(23, 59, 59, 999);

    // Get day labels
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = [];

    // For each day of the week, count active users
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // Count active students (from enrollments with last_accessed in this day)
      // Get all unique student IDs that accessed courses on this day
      const activeStudentsResult = await db
        .select({ student_id: enrollmentsTable.student_id })
        .from(enrollmentsTable)
        .where(
          and(
            sql`${enrollmentsTable.last_accessed} IS NOT NULL`,
            gte(enrollmentsTable.last_accessed, dayStart),
            lte(enrollmentsTable.last_accessed, dayEnd),
            eq(enrollmentsTable.status, 'approved')
          )
        );

      // Get unique student IDs
      const uniqueStudentIds = new Set(activeStudentsResult.map(r => r.student_id));
      const activeStudents = uniqueStudentIds.size;

      // Count active teachers (teachers who created/updated courses, lessons, or quizzes on this day)
      // Get unique teacher emails from courses, lessons, and quizzes created/updated on this day
      const activeTeachersFromCourses = await db
        .select({ email: coursesTable.assigned_teacher_id })
        .from(coursesTable)
        .where(
          and(
            gte(coursesTable.updated_at, dayStart),
            lte(coursesTable.updated_at, dayEnd),
            sql`${coursesTable.assigned_teacher_id} IS NOT NULL`
          )
        );

      const activeTeachersFromLessons = await db
        .select({ email: coursesTable.assigned_teacher_id })
        .from(lessonsTable)
        .innerJoin(coursesTable, eq(lessonsTable.course_id, coursesTable.id))
        .where(
          and(
            gte(lessonsTable.created_at, dayStart),
            lte(lessonsTable.created_at, dayEnd),
            sql`${coursesTable.assigned_teacher_id} IS NOT NULL`
          )
        );

      const activeTeachersFromQuizzes = await db
        .select({ email: coursesTable.assigned_teacher_id })
        .from(quizzesTable)
        .innerJoin(coursesTable, eq(quizzesTable.course_id, coursesTable.id))
        .where(
          and(
            gte(quizzesTable.created_at, dayStart),
            lte(quizzesTable.created_at, dayEnd),
            sql`${coursesTable.assigned_teacher_id} IS NOT NULL`
          )
        );

      // Combine and get unique teacher emails
      const allTeacherEmails = new Set();
      activeTeachersFromCourses.forEach(t => t.email && allTeacherEmails.add(t.email));
      activeTeachersFromLessons.forEach(t => t.email && allTeacherEmails.add(t.email));
      activeTeachersFromQuizzes.forEach(t => t.email && allTeacherEmails.add(t.email));

      const activeTeachers = allTeacherEmails.size;

      // Total active users (students + teachers)
      const totalActiveUsers = activeStudents + activeTeachers;

      weeklyData.push({
        day: days[i],
        activeUsers: totalActiveUsers,
        students: activeStudents,
        teachers: activeTeachers
      });
    }

    return NextResponse.json({
      weeklyData,
      weekRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching weekly usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weekly usage data' },
      { status: 500 }
    );
  }
}

