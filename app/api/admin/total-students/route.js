import { db } from '@/config/db';
import { enrollmentsTable } from '@/config/schema';
import { eq, count } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log("👥 Fetching total students count...");

    // Get all approved enrollments first
    const approvedEnrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.status, 'approved'));

    // Count unique students manually
    const uniqueStudentIds = new Set();
    approvedEnrollments.forEach(enrollment => {
      uniqueStudentIds.add(enrollment.student_id);
    });

    const totalStudents = uniqueStudentIds.size;

    console.log(`✅ Total students: ${totalStudents}`);
    return NextResponse.json({ totalStudents });

  } catch (error) {
    console.error('Error fetching total students:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}