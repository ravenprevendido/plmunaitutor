// app/api/notifications/route.js
import { db } from '@/config/db';
import { courseNotificationsTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teacherEmail = user.primaryEmailAddress?.emailAddress;
    const notifications = await db
      .select()
      .from(courseNotificationsTable)
      .where(eq(courseNotificationsTable.teacher_email, teacherEmail))
      .orderBy(courseNotificationsTable.created_at);

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const notificationData = await request.json();
    
    const newNotification = await db
      .insert(courseNotificationsTable)
      .values(notificationData)
      .returning();

    return NextResponse.json(newNotification[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}