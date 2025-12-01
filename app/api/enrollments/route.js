import { db } from '@/config/db';
import { enrollmentsTable, coursesTable, teachersTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// GET student's enrollments
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.student_id, userId))
      .orderBy(enrollmentsTable.created_at);

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



// POST new enrollment request
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { course_id, student_name, student_email } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📝 Creating enrollment request:", {
      student_id: userId,
      course_id,
      student_name,
      student_email
    });

    // Check if course exists and get teacher info
    const course = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title,
        assigned_teacher_id: coursesTable.assigned_teacher_id,
        teacher_name: teachersTable.name,
        teacher_email: teachersTable.email
      })
      .from(coursesTable)
      .leftJoin(teachersTable, eq(coursesTable.assigned_teacher_id, teachersTable.email))
      .where(eq(coursesTable.id, course_id))
      .then(rows => rows[0]);

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if enrollment already exists FOR THIS SPECIFIC STUDENT
    const existingEnrollment = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.student_id, userId),
          eq(enrollmentsTable.course_id, course_id)
        )
      )
      .then(rows => rows[0]);

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: 'You already have an enrollment request for this course' 
      }, { status: 400 });
    }

    // Create enrollment request
    const newEnrollment = await db
      .insert(enrollmentsTable)
      .values({
        student_id: userId,
        student_name,
        student_email,
        course_id,
        course_title: course.title,
        teacher_name: course.teacher_name,
        teacher_email: course.teacher_email,
        status: 'pending',
        progress: 0
      })
      .returning();

    console.log("✅ Enrollment request created:", newEnrollment[0]);
    console.log(`🔔 New enrollment request from ${student_name} for ${course.title}`);

    return NextResponse.json(newEnrollment[0], { status: 201 });

  } catch (error) {
    console.error('Error creating enrollment request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update enrollment (for progress, status, etc.)
export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    const { enrollmentId, courseId, last_accessed, progress, status } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = {};
    if (last_accessed) updates.last_accessed = new Date(last_accessed);
    if (progress !== undefined) updates.progress = progress;
    if (status) updates.status = status;

    const updatedEnrollment = await db
      .update(enrollmentsTable)
      .set(updates)
      .where(eq(enrollmentsTable.id, enrollmentId))
      .where(eq(enrollmentsTable.student_id, userId))
      .returning();

    if (updatedEnrollment.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json(updatedEnrollment[0]);
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}