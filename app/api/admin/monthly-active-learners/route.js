// app/api/admin/monthly-active-learners/route.js
import { db } from '@/config/db';
import { enrollmentsTable, studentProgressTable, lessonProgressTable } from '@/config/schema';
import { gte, lte, sql, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get the last 9 months of data
    const now = new Date();
    const months = [];
    
    for (let i = 8; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        year: monthDate.getFullYear(),
        monthIndex: monthDate.getMonth(),
        startDate: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        endDate: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59)
      });
    }

    const monthlyData = await Promise.all(
      months.map(async (month) => {
        // Count distinct active students for this month
        // A student is active if they:
        // 1. Accessed a course (enrollments.last_accessed)
        // 2. Completed progress (studentProgressTable)
        // 3. Accessed lesson progress (lessonProgressTable.last_accessed)

        // Get active students from enrollments
        const activeFromEnrollments = await db
          .selectDistinct({ student_id: enrollmentsTable.student_id })
          .from(enrollmentsTable)
          .where(
            and(
              sql`${enrollmentsTable.last_accessed} IS NOT NULL`,
              gte(enrollmentsTable.last_accessed, month.startDate),
              lte(enrollmentsTable.last_accessed, month.endDate)
            )
          );

        // Get active students from student progress
        const activeFromProgress = await db
          .selectDistinct({ student_id: studentProgressTable.student_id })
          .from(studentProgressTable)
          .where(
            and(
              gte(studentProgressTable.created_at, month.startDate),
              lte(studentProgressTable.created_at, month.endDate)
            )
          );

        // Get active students from lesson progress
        const activeFromLessonProgress = await db
          .selectDistinct({ user_id: lessonProgressTable.user_id })
          .from(lessonProgressTable)
          .where(
            and(
              sql`${lessonProgressTable.last_accessed} IS NOT NULL`,
              gte(lessonProgressTable.last_accessed, month.startDate),
              lte(lessonProgressTable.last_accessed, month.endDate)
            )
          );

        // Combine all unique student IDs
        const allActiveStudents = new Set();
        activeFromEnrollments.forEach(e => allActiveStudents.add(e.student_id));
        activeFromProgress.forEach(p => allActiveStudents.add(p.student_id));
        activeFromLessonProgress.forEach(l => allActiveStudents.add(l.user_id));

        return {
          month: month.month,
          count: allActiveStudents.size
        };
      })
    );

    return NextResponse.json(monthlyData);

  } catch (error) {
    console.error('❌ Error fetching monthly active learners:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

