import { db } from '@/config/db';
import { coursesTable } from '@/config/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log("👨‍🏫 Fetching all courses for teacher dashboard...");

    // Return ALL courses but include assignment status
    const allCourses = await db
      .select()
      .from(coursesTable)
      .orderBy(coursesTable.created_at);

    console.log(`✅ Found ${allCourses.length} courses for teacher dashboard`);
    return NextResponse.json(allCourses);

  } catch (error) {
    console.error("❌ Teacher Courses API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}