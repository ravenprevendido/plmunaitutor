import { db } from '@/config/db';
import { assignmentsTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    
    console.log(`📋 Fetching assignments for course ID: ${courseId}`);
    
    const assignments = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.course_id, courseId))
      .orderBy(assignmentsTable.created_at);

    console.log(`✅ Found ${assignments.length} assignments for course ${courseId}`);
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('❌ Error fetching assignments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    const formData = await request.formData();
    
    const title = formData.get('title');
    const description = formData.get('description');
    const deadline = formData.get('deadline');
    const max_score = formData.get('max_score');
    const file = formData.get('attachment');

    console.log(`🆕 Creating assignment for course ID: ${courseId}`);

    let attachmentUrl = null;

    // Handle file upload
    if (file && file instanceof File) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'assignments');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const filepath = join(uploadsDir, filename);

      // Save file
      await writeFile(filepath, buffer);

      // Store URL path (relative to public folder)
      attachmentUrl = `/uploads/assignments/${filename}`;
    }

    const newAssignment = await db
      .insert(assignmentsTable)
      .values({
        course_id: courseId,
        title: title,
        description: description,
        deadline: deadline ? new Date(deadline) : null,
        attachment_url: attachmentUrl,
        max_score: max_score ? parseInt(max_score) : 100
      })
      .returning();

    console.log(`✅ Assignment created successfully for course ${courseId}`);
    return NextResponse.json(newAssignment[0], { status: 201 });
  } catch (error) {
    console.error('❌ Error creating assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}