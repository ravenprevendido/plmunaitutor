import { db } from '@/config/db';
import { announcementsTable } from '@/config/schema';
import { eq, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    
    console.log(`📢 Fetching announcements for course ID: ${courseId}`);
    
    const announcements = await db
      .select()
      .from(announcementsTable)
      .where(eq(announcementsTable.course_id, courseId))
      .orderBy(desc(announcementsTable.created_at));

    console.log(`✅ Found ${announcements.length} announcements for course ${courseId}`);
    return NextResponse.json(announcements);
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    const { message } = await request.json();

    console.log(`🆕 Creating announcement for course ID: ${courseId}`);

    const newAnnouncement = await db
      .insert(announcementsTable)
      .values({
        course_id: courseId,
        message
      })
      .returning();

    console.log(`✅ Announcement created successfully for course ${courseId}`);
    return NextResponse.json(newAnnouncement[0], { status: 201 });
  } catch (error) {
    console.error('❌ Error creating announcement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}