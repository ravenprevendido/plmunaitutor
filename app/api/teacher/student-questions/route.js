// app/api/teacher/student-questions/route.js
import { db } from '@/config/db';
import { 
  studentQuestionsTable,
  coursesTable,
  usersTable
} from '@/config/schema';
import { eq, desc, inArray, or, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📊 Fetching student questions for teacher:", userId);

    // Get teacher's data
    const teacher = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role
      })
      .from(usersTable)
      .where(eq(usersTable.clerk_id, userId))
      .then(rows => rows[0]);

    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const teacherEmail = teacher.email;

    // Get teacher's courses
    const teacherCourses = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title
      })
      .from(coursesTable)
      .where(eq(coursesTable.assigned_teacher_id, teacherEmail));

    const courseIds = teacherCourses.map(course => course.id);

    // If teacher has no courses, return empty array
    if (courseIds.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // Get student questions from teacher's courses
    const whereClause = courseIds.length > 0
      ? or(
          inArray(studentQuestionsTable.course_id, courseIds),
          isNull(studentQuestionsTable.course_id)
        )
      : isNull(studentQuestionsTable.course_id);

    const studentQuestions = await db
      .select()
      .from(studentQuestionsTable)
      .where(whereClause)
      .orderBy(desc(studentQuestionsTable.asked_at))
      .limit(25);

    console.log(`✅ Found ${studentQuestions.length} student questions`);
    return NextResponse.json({ questions: studentQuestions });

  } catch (error) {
    console.error('❌ Error fetching student questions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}