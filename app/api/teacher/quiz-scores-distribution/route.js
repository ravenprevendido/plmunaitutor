// app/api/teacher/quiz-scores-distribution/route.js
import { db } from '@/config/db';
import { 
  coursesTable, 
  quizzesTable,
  studentProgressTable,
  usersTable
} from '@/config/schema';
import { eq, and, sql, isNotNull, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📊 Fetching quiz scores distribution for teacher:", userId);

    // Get teacher's email
    const teacher = await db
      .select({
        email: usersTable.email
      })
      .from(usersTable)
      .where(eq(usersTable.clerk_id, userId))
      .then(rows => rows[0]);

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const teacherEmail = teacher.email;

    // Get teacher's courses
    const teacherCourses = await db
      .select({
        id: coursesTable.id
      })
      .from(coursesTable)
      .where(eq(coursesTable.assigned_teacher_id, teacherEmail));

    if (teacherCourses.length === 0) {
      return NextResponse.json([
        { name: "Grade A", value: 0 },
        { name: "Grade B", value: 0 },
        { name: "Grade C", value: 0 },
        { name: "Grade D", value: 0 },
        { name: "Grade F", value: 0 }
      ]);
    }

    const courseIds = teacherCourses.map(course => course.id);

    // Get all quiz scores from teacher's quizzes
    const quizScores = await db
      .select({
        score: studentProgressTable.score
      })
      .from(studentProgressTable)
      .innerJoin(quizzesTable, eq(studentProgressTable.quiz_id, quizzesTable.id))
      .where(
        and(
          inArray(studentProgressTable.course_id, courseIds),
          eq(studentProgressTable.completed, true),
          isNotNull(studentProgressTable.quiz_id),
          isNotNull(studentProgressTable.score)
        )
      );

    // Categorize scores into grades
    const gradeCounts = {
      A: 0, // 90-100
      B: 0, // 80-89
      C: 0, // 70-79
      D: 0, // 60-69
      F: 0  // 0-59
    };

    quizScores.forEach(record => {
      const score = parseFloat(record.score) || 0;
      if (score >= 90) gradeCounts.A++;
      else if (score >= 80) gradeCounts.B++;
      else if (score >= 70) gradeCounts.C++;
      else if (score >= 60) gradeCounts.D++;
      else gradeCounts.F++;
    });

    const total = quizScores.length;
    
    // Calculate percentages
    const distribution = [
      { name: "Grade A", value: total > 0 ? Math.round((gradeCounts.A / total) * 100) : 0 },
      { name: "Grade B", value: total > 0 ? Math.round((gradeCounts.B / total) * 100) : 0 },
      { name: "Grade C", value: total > 0 ? Math.round((gradeCounts.C / total) * 100) : 0 },
      { name: "Grade D", value: total > 0 ? Math.round((gradeCounts.D / total) * 100) : 0 },
      { name: "Grade F", value: total > 0 ? Math.round((gradeCounts.F / total) * 100) : 0 }
    ];

    return NextResponse.json(distribution);

  } catch (error) {
    console.error('❌ Error fetching quiz scores distribution:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

