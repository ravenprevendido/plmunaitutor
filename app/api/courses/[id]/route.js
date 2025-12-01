import { db } from '@/config/db';
import { coursesTable, teachersTable } from '@/config/schema'; // Add teachersTable import
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params; // Add await here
    
    // Updated query to include teacher information
    const course = await db
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
      .where(eq(coursesTable.id, id))
      .then(rows => rows[0]);
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    
    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // Add await here
    const updateData = await request.json();

    const updatedCourse = await db
      .update(coursesTable)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(coursesTable.id, id))
      .returning();

    return NextResponse.json(updatedCourse[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params; // Add await here
    await db.delete(coursesTable).where(eq(coursesTable.id, id));
    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}