import { db } from '@/config/db';
import { enrollmentsTable, coursesTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log("📊 Fetching course popularity for admin");

    // Get all courses
    const allCourses = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title,
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
          course_id: course.id,
          course_title: course.title,
          enrollment_count: enrollments.length,
        };
      })
    );

    // Sort by enrollment count (descending) and limit to top 10
    coursesWithEnrollments.sort((a, b) => b.enrollment_count - a.enrollment_count);
    const chartData = coursesWithEnrollments.slice(0, 10).map(course => ({
      title: course.course_title,
      enrollments: course.enrollment_count,
    }));

    console.log(`✅ Found ${chartData.length} courses with enrollments`);
    return NextResponse.json(chartData);

  } catch (error) {
    console.error("❌ Course Popularity API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

