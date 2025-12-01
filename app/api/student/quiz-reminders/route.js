import { db } from '@/config/db';
import { quizzesTable, coursesTable, enrollmentsTable, studentProgressTable } from '@/config/schema';
import { eq, and, gt, isNull, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📋 Fetching quiz reminders for student:", userId);

    // Get student's enrolled courses
    const enrollments = await db
      .select({
        course_id: enrollmentsTable.course_id
      })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.student_id, userId));

    if (enrollments.length === 0) {
      return NextResponse.json([]);
    }

    const courseIds = enrollments.map(enrollment => enrollment.course_id);

    // Get upcoming quizzes from enrolled courses that student hasn't completed
    const upcomingQuizzes = await db
      .select({
        id: quizzesTable.id,
        title: quizzesTable.title,
        description: quizzesTable.description,
        course_id: quizzesTable.course_id,
        course_title: coursesTable.title,
        deadline: quizzesTable.deadline,
        created_at: quizzesTable.created_at,
        questions: quizzesTable.questions
      })
      .from(quizzesTable)
      .innerJoin(coursesTable, eq(quizzesTable.course_id, coursesTable.id))
      .where(
        and(
          inArray(quizzesTable.course_id, courseIds),
          gt(quizzesTable.deadline, new Date()), // Only future deadlines
          isNull(quizzesTable.deadline) // Include quizzes without deadlines too
        )
      )
      .orderBy(quizzesTable.deadline);

    console.log("📊 Found upcoming quizzes:", upcomingQuizzes.length);

    // Get student's completed quizzes to filter out
    const completedQuizzes = await db
      .select({
        quiz_id: studentProgressTable.quiz_id
      })
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.completed, true)
        )
      );

    const completedQuizIds = completedQuizzes.map(quiz => quiz.quiz_id);

    // Filter out completed quizzes and format reminders
    const reminders = upcomingQuizzes
      .filter(quiz => !completedQuizIds.includes(quiz.id))
      .map(quiz => {
        const now = new Date();
        const deadline = quiz.deadline ? new Date(quiz.deadline) : null;
        
        let timeRemaining = '';
        let priority = '';
        
        if (deadline) {
          const timeDiff = deadline.getTime() - now.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
          
          if (daysRemaining <= 1) {
            timeRemaining = 'Due today';
            priority = 'High Priority';
          } else if (daysRemaining <= 3) {
            timeRemaining = `Due in ${daysRemaining} days`;
            priority = 'High Priority';
          } else if (daysRemaining <= 7) {
            timeRemaining = `Due in ${daysRemaining} days`;
            priority = 'Medium Priority';
          } else {
            timeRemaining = `Due in ${daysRemaining} days`;
            priority = '';
          }
        } else {
          timeRemaining = 'No deadline';
          priority = '';
        }

        // Calculate how long ago the quiz was created
        const createdAgo = Math.floor((now - new Date(quiz.created_at)) / (1000 * 60 * 60));
        let createdText = '';
        
        if (createdAgo < 1) {
          createdText = 'Just now';
        } else if (createdAgo < 24) {
          createdText = `${createdAgo} hours ago`;
        } else {
          const days = Math.floor(createdAgo / 24);
          createdText = `${days} days ago`;
        }

        return {
          id: quiz.id,
          title: quiz.title,
          course: quiz.course_title,
          timeRemaining: deadline ? timeRemaining : createdText,
          priority: priority,
          deadline: quiz.deadline,
          created_at: quiz.created_at,
          hasDeadline: !!quiz.deadline
        };
      });

    // Sort by priority and deadline
    reminders.sort((a, b) => {
      // High priority first
      if (a.priority === 'High Priority' && b.priority !== 'High Priority') return -1;
      if (b.priority === 'High Priority' && a.priority !== 'High Priority') return 1;
      
      // Then by deadline (sooner first)
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      
      // Then by creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    console.log("✅ Final reminders:", reminders);
    return NextResponse.json(reminders);

  } catch (error) {
    console.error('❌ Error fetching quiz reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}