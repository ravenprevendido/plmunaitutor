
import { db } from '@/config/db';
import { quizzesTable, coursesTable, studentProgressTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { quizId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("🔍 Fetching quiz results for quiz ID:", quizId);

    // Get quiz with course information
    const quiz = await db
      .select({
        id: quizzesTable.id,
        title: quizzesTable.title,
        description: quizzesTable.description,
        questions: quizzesTable.questions,
        course_id: quizzesTable.course_id,
        course_title: coursesTable.title,
        created_at: quizzesTable.created_at,
        deadline: quizzesTable.deadline,
      })
      .from(quizzesTable)
      .innerJoin(coursesTable, eq(quizzesTable.course_id, coursesTable.id))
      .where(eq(quizzesTable.id, parseInt(quizId)))
      .then(rows => rows[0]);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Get student's progress for this quiz
    const progress = await db
      .select()
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.quiz_id, parseInt(quizId))
        )
      )
      .then(rows => rows[0]);

    if (!progress) {
      return NextResponse.json({ error: 'Quiz progress not found' }, { status: 404 });
    }

    const quizData = {
      ...quiz,
      difficulty: 'medium',
      timeSpent: '15:30',
      course: quiz.course_title,
      courseId: quiz.course_id
    };

    console.log("✅ Quiz data found:", quizData);
    return NextResponse.json(quizData);

  } catch (error) {
    console.error('❌ Error fetching quiz results:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



// import { db } from '@/config/db';
// import { quizzesTable, coursesTable, studentProgressTable } from '@/config/schema';
// import { eq, and } from 'drizzle-orm';
// import { NextResponse } from 'next/server';
// import { getAuth } from '@clerk/nextjs/server';

// export async function GET(request, { params }) {
//   try {
//     const { userId } = getAuth(request);
//     const { quizId } = await params;
    
//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     console.log("🔍 Fetching quiz results for quiz ID:", quizId);

//     // Get quiz with course information
//     const quiz = await db
//       .select({
//         id: quizzesTable.id,
//         title: quizzesTable.title,
//         description: quizzesTable.description,
//         questions: quizzesTable.questions,
//         course_id: quizzesTable.course_id,
//         course_title: coursesTable.title,
//         created_at: quizzesTable.created_at,
//         deadline: quizzesTable.deadline,
//       })
//       .from(quizzesTable)
//       .innerJoin(coursesTable, eq(quizzesTable.course_id, coursesTable.id))
//       .where(eq(quizzesTable.id, parseInt(quizId)))
//       .then(rows => rows[0]);

//     if (!quiz) {
//       return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
//     }

//     // Get student's progress for this quiz
//     const progress = await db
//       .select()
//       .from(studentProgressTable)
//       .where(
//         and(
//           eq(studentProgressTable.student_id, userId),
//           eq(studentProgressTable.quiz_id, parseInt(quizId))
//         )
//       )
//       .then(rows => rows[0]);

//     if (!progress) {
//       return NextResponse.json({ error: 'Quiz progress not found' }, { status: 404 });
//     }

//     const quizData = {
//       ...quiz,
//       difficulty: 'medium',
//       timeSpent: '15:30',
//       course: quiz.course_title,
//       courseId: quiz.course_id
//     };

//     console.log("✅ Quiz data found:", quizData);
//     return NextResponse.json(quizData);

//   } catch (error) {
//     console.error('❌ Error fetching quiz results:', error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }