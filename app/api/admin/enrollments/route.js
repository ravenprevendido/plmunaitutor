import { db } from '@/config/db';
import { enrollmentsTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// GET all enrollments for admin
export async function GET() {
  try {
    console.log("📋 Fetching all enrollments...");
    
    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .orderBy(enrollmentsTable.created_at);
    
    console.log(`✅ Found ${enrollments.length} enrollments`);
    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - approve/reject enrollment
export async function PUT(request) {
  try {
    const { enrollmentId, action } = await request.json();

    if (!enrollmentId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: enrollmentId and action' 
      }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "approved" or "rejected"' 
      }, { status: 400 });
    }

    console.log(`🔄 Processing enrollment ${enrollmentId} with action: ${action}`);

    // Get the enrollment first
    const enrollment = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.id, enrollmentId))
      .then(rows => rows[0]);

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Update enrollment status
    await db
      .update(enrollmentsTable)
      .set({ 
        status: action,
        updated_at: new Date()
      })
      .where(eq(enrollmentsTable.id, enrollmentId));

    console.log(`✅ Enrollment ${action} for student: ${enrollment.student_name}`);

    return NextResponse.json({ 
      message: `Enrollment ${action} successfully`,
      student_name: enrollment.student_name,
      course_title: enrollment.course_title,
      action: action
    });

  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE enrollment
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('id');

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Missing enrollment ID' }, { status: 400 });
    }

    await db
      .delete(enrollmentsTable)
      .where(eq(enrollmentsTable.id, enrollmentId));

    return NextResponse.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}