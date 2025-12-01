// app/api/teacher/daily-study-time/route.js
import { db } from '@/config/db';
import { 
  coursesTable, 
  enrollmentsTable,
  lessonProgressTable,
  usersTable
} from '@/config/schema';
import { eq, and, sql, gte, lte, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📊 Fetching daily study time for teacher:", userId);

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
        id: coursesTable.id
      })
      .from(coursesTable)
      .where(eq(coursesTable.assigned_teacher_id, teacherEmail));

    if (teacherCourses.length === 0) {
      // Return default data for all days
      return NextResponse.json([
        { name: "Mon", mins: 0 },
        { name: "Tue", mins: 0 },
        { name: "Wed", mins: 0 },
        { name: "Thu", mins: 0 },
        { name: "Fri", mins: 0 },
        { name: "Sat", mins: 0 },
        { name: "Sun", mins: 0 }
      ]);
    }

    const courseIds = teacherCourses.map(course => course.id);

    // Get enrolled students for teacher's courses
    const enrolledStudents = await db
      .selectDistinct({ student_id: enrollmentsTable.student_id })
      .from(enrollmentsTable)
      .where(
        and(
          inArray(enrollmentsTable.course_id, courseIds),
          eq(enrollmentsTable.status, 'approved')
        )
      );

    const studentIds = enrolledStudents.map(s => s.student_id);

    if (studentIds.length === 0) {
      return NextResponse.json([
        { name: "Mon", mins: 0 },
        { name: "Tue", mins: 0 },
        { name: "Wed", mins: 0 },
        { name: "Thu", mins: 0 },
        { name: "Fri", mins: 0 },
        { name: "Sat", mins: 0 },
        { name: "Sun", mins: 0 }
      ]);
    }

    // Get the last 7 days
    const now = new Date();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      // Get study time from lesson progress for this day
      const studySessions = await db
        .select({
          started_at: lessonProgressTable.started_at,
          completed_at: lessonProgressTable.completed_at,
          last_accessed: lessonProgressTable.last_accessed
        })
        .from(lessonProgressTable)
        .where(
          and(
            inArray(lessonProgressTable.user_id, studentIds),
            gte(lessonProgressTable.last_accessed, dayStart),
            lte(lessonProgressTable.last_accessed, dayEnd)
          )
        );

      // Calculate average study time (in minutes)
      // Estimate: if completed, assume 30 minutes; if in progress, use time difference
      let totalMinutes = 0;
      studySessions.forEach(session => {
        if (session.completed_at && session.started_at) {
          const diff = new Date(session.completed_at) - new Date(session.started_at);
          totalMinutes += Math.max(5, Math.round(diff / (1000 * 60))); // Minimum 5 minutes
        } else if (session.started_at) {
          // If not completed, estimate based on last accessed
          const diff = new Date(session.last_accessed) - new Date(session.started_at);
          totalMinutes += Math.max(5, Math.min(30, Math.round(diff / (1000 * 60))));
        } else {
          // Default estimate for sessions without start time
          totalMinutes += 15;
        }
      });

      const averageMinutes = studentIds.length > 0 
        ? Math.round(totalMinutes / studentIds.length)
        : 0;

      dailyData.push({
        name: daysOfWeek[date.getDay()],
        mins: averageMinutes
      });
    }

    return NextResponse.json(dailyData);

  } catch (error) {
    console.error('❌ Error fetching daily study time:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

