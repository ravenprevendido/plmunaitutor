import { db } from '@/config/db';
import { coursesTable, enrollmentsTable, teachersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("🎓 Fetching courses for student:", userId);

    // Get all courses with teacher information
    const allCourses = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title,
        description: coursesTable.description,
        category: coursesTable.category,
        image_url: coursesTable.image_url,
        slug: coursesTable.slug,
        created_at: coursesTable.created_at,
        assigned_teacher_id: coursesTable.assigned_teacher_id,
        teacher_name: teachersTable.name,
        teacher_email: teachersTable.email
      })
      .from(coursesTable)
      .leftJoin(teachersTable, eq(coursesTable.assigned_teacher_id, teachersTable.email))
      .orderBy(coursesTable.created_at);

    // Get student's enrollments
    const studentEnrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.student_id, userId));
    // Combine course data with enrollment status
    const coursesWithEnrollment = allCourses.map(course => {
      const enrollment = studentEnrollments.find(e => e.course_id === course.id);
    
      return {
        ...course,
        enrollment_status: enrollment?.status || 'not_enrolled',
        progress: enrollment?.progress || 0,
        last_accessed: enrollment?.last_accessed,
        enrollment_id: enrollment?.id
      };
    });

    console.log(`✅ Found ${coursesWithEnrollment.length} courses for student`);
    return NextResponse.json(coursesWithEnrollment);

  } catch (error) {
    console.error("❌ Student Courses API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}