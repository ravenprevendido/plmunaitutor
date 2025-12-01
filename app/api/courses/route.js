import { db } from '@/config/db';
import { coursesTable, teachersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    // If slug is provided, fetch course by slug
    if (slug) {
      console.log(`📦 Fetching course by slug: ${slug}`);
      
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
        .where(eq(coursesTable.slug, slug))
        .then(rows => rows[0]);

      if (!course) {
        console.log(`❌ Course not found with slug: ${slug}`);
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      console.log(`✅ Found course: ${course.title} (ID: ${course.id})`);
      return NextResponse.json([course]); // Return as array for consistency with existing code
    }

    // If no slug, return all courses
    console.log("📦 Fetching all courses...");
    const allCourses = await db
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
      .orderBy(coursesTable.created_at);
    
    console.log(`✅ Found ${allCourses.length} courses`);
    return NextResponse.json(allCourses);
  } catch (error) {
    console.error("❌ GET Courses Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const courseData = await request.json();
    console.log("🆕 Creating course:", courseData);

    // Generate slug if not provided
    if (!courseData.slug) {
      courseData.slug = courseData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    const newCourse = await db.insert(coursesTable).values(courseData).returning();
    console.log("✅ Course created successfully:", newCourse[0]);
    
    return NextResponse.json(newCourse[0], { status: 201 });

  } catch (error) {
    console.error("❌ POST Courses Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}