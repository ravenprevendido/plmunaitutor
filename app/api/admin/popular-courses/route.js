// app/api/admin/popular-courses/route.js
import { db } from '@/config/db';
import { coursesTable, enrollmentsTable } from '@/config/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get all courses
    const allCourses = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title
      })
      .from(coursesTable);

    // Get enrollment counts for each course
    const coursesWithEnrollments = await Promise.all(
      allCourses.map(async (course) => {
        const enrollments = await db
          .select()
          .from(enrollmentsTable)
          .where(
            and(
              eq(enrollmentsTable.course_id, course.id),
              eq(enrollmentsTable.status, 'approved')
            )
          );

        return {
          title: course.title,
          enrollments: enrollments.length
        };
      })
    );

    // Sort by enrollment count (descending) and get top 5
    coursesWithEnrollments.sort((a, b) => b.enrollments - a.enrollments);
    const topCourses = coursesWithEnrollments.slice(0, 5);

    // If we have fewer than 5 courses, fill with zeros
    while (topCourses.length < 5) {
      topCourses.push({
        title: `Course ${topCourses.length + 1}`,
        enrollments: 0
      });
    }
    return NextResponse.json(topCourses);

  } catch (error) {
    console.error('❌ Error fetching popular courses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

