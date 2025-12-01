import { db } from '@/config/db';
import { enrollmentsTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params; // Add await here
    const courseId = parseInt(id);
    
    // IMPORTANT: Get ONLY students enrolled in THIS SPECIFIC COURSE
    // This ensures each teacher only notifies students in their own course
    const students = await db
      .select({
        id: enrollmentsTable.id,
        student_id: enrollmentsTable.student_id,
        student_name: enrollmentsTable.student_name,
        student_email: enrollmentsTable.student_email,
        course_id: enrollmentsTable.course_id,
        course_title: enrollmentsTable.course_title,
        teacher_name: enrollmentsTable.teacher_name,
        teacher_email: enrollmentsTable.teacher_email,
        status: enrollmentsTable.status,
        progress: enrollmentsTable.progress,
        last_accessed: enrollmentsTable.last_accessed,
        created_at: enrollmentsTable.created_at
      })
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.course_id, courseId), // Filter by specific course ID
          eq(enrollmentsTable.status, 'approved') // Only approved enrollments
        )
      );

    console.log(`📧 Course ${courseId}: Found ${students.length} enrolled students`);
    if (students.length > 0) {
      console.log(`📋 Course "${students[0].course_title}": Students - ${students.map(s => s.student_name).join(', ')}`);
    }
    
    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}