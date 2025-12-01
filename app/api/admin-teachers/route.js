import { db } from '@/config/db';
import { teachersTable, coursesTable, courseRequestsTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// GET all teachers
export async function GET() {
  try {
    console.log("📋 Fetching all teachers...");
    const teachers = await db
      .select()
      .from(teachersTable)
      .orderBy(teachersTable.created_at);
    
    console.log(`✅ Found ${teachers.length} teachers`);
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('❌ Error fetching teachers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE teacher
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('id');
    
    console.log(`🗑️ Removing teacher with ID: ${teacherId}`);

    // Get teacher data first
    const teacher = await db
      .select()
      .from(teachersTable)
      .where(eq(teachersTable.id, teacherId))
      .then(rows => rows[0]);

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Remove teacher assignment from all courses
    await db
      .update(coursesTable)
      .set({ assigned_teacher_id: null })
      .where(eq(coursesTable.assigned_teacher_id, teacher.email));

    // Delete the teacher
    await db
      .delete(teachersTable)
      .where(eq(teachersTable.id, teacherId));

    console.log(`✅ Teacher ${teacher.name} removed successfully`);
    return NextResponse.json({ 
      message: 'Teacher removed successfully',
      teacher_name: teacher.name
    });

  } catch (error) {
    console.error('❌ Error deleting teacher:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}