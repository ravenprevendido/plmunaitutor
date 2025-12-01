// app/api/ai/check-quiz-questions/utils.js
// Shared utility function for checking quiz questions
import { db } from '@/config/db';
import { quizzesTable, studentProgressTable, enrollmentsTable } from '@/config/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function checkQuizQuestions(userId, prompt, conversationHistory = []) {
  try {
    if (!userId || !prompt) {
      return { isQuizQuestion: false, quizCompleted: true, hasIncompleteQuizzes: false };
    }

    // Get student's enrolled courses
    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.student_id, userId),
          eq(enrollmentsTable.status, 'approved')
        )
      );

    if (enrollments.length === 0) {
      return { isQuizQuestion: false, quizCompleted: true, hasIncompleteQuizzes: false };
    }

    const courseIds = enrollments.map(e => e.course_id);

    // Get all quizzes from enrolled courses
    const allQuizzes = await db
      .select({
        id: quizzesTable.id,
        title: quizzesTable.title,
        questions: quizzesTable.questions
      })
      .from(quizzesTable)
      .where(inArray(quizzesTable.course_id, courseIds));

    // Get all completed quizzes for this student
    const completedQuizzes = await db
      .select({
        quiz_id: studentProgressTable.quiz_id
      })
      .from(studentProgressTable)
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.completed, true),
          inArray(studentProgressTable.course_id, courseIds)
        )
      );

    const completedQuizIds = new Set(
      completedQuizzes
        .filter(q => q.quiz_id !== null)
        .map(q => q.quiz_id)
    );

    // Find incomplete quizzes
    const incompleteQuizzes = allQuizzes.filter(quiz => !completedQuizIds.has(quiz.id));
    const hasIncompleteQuizzes = incompleteQuizzes.length > 0;

    // Check if the prompt contains quiz questions (direct match)
    let detectedQuizId = null;
    let isQuizQuestion = false;

    for (const quiz of allQuizzes) {
      if (!quiz.questions) continue;

      try {
        const questions = typeof quiz.questions === 'string' 
          ? JSON.parse(quiz.questions) 
          : quiz.questions;

        if (Array.isArray(questions)) {
          // Check if any question text appears in the prompt
          const promptLower = prompt.toLowerCase();
          for (const question of questions) {
            if (question.question) {
              const questionText = question.question.toLowerCase();
              // Check if a significant portion of the question appears in the prompt
              const words = questionText.split(/\s+/).filter(w => w.length > 3);
              const matchingWords = words.filter(w => promptLower.includes(w));
              
              // If more than 30% of significant words match, consider it a quiz question
              if (words.length > 0 && (matchingWords.length / words.length) > 0.3) {
                isQuizQuestion = true;
                detectedQuizId = quiz.id;
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing quiz questions:', error);
      }

      if (isQuizQuestion) break;
    }

    // Check if the prompt is asking for quiz answers (indirect detection)
    const promptLower = prompt.toLowerCase();
    const answerRequestPatterns = [
      /give me the answer/i,
      /what is the answer/i,
      /tell me the answer/i,
      /provide the answer/i,
      /show me the answer/i,
      /what's the answer/i,
      /the answer is/i,
      /correct answer/i,
      /right answer/i,
      /solution to/i,
      /solve this/i,
      /help me with this quiz/i,
      /quiz answer/i,
      /answer for the quiz/i,
      /answer to quiz/i
    ];

    const isAskingForAnswer = answerRequestPatterns.some(pattern => pattern.test(prompt));

    // Check conversation history for quiz-related context
    const conversationText = conversationHistory
      .map(msg => msg.content || '')
      .join(' ')
      .toLowerCase();

    const quizKeywords = ['quiz', 'test', 'exam', 'assessment', 'question', 'answer'];
    const hasQuizContext = quizKeywords.some(keyword => 
      conversationText.includes(keyword) || promptLower.includes(keyword)
    );

    // If asking for answers AND has quiz context AND has incomplete quizzes, treat as quiz question
    if (isAskingForAnswer && hasQuizContext && hasIncompleteQuizzes && !isQuizQuestion) {
      isQuizQuestion = true;
      // Use the first incomplete quiz as reference
      detectedQuizId = incompleteQuizzes[0]?.id || null;
    }

    // If we detected a quiz question, check if it's completed
    if (isQuizQuestion && detectedQuizId) {
      const progress = await db
        .select()
        .from(studentProgressTable)
        .where(
          and(
            eq(studentProgressTable.student_id, userId),
            eq(studentProgressTable.quiz_id, detectedQuizId),
            eq(studentProgressTable.completed, true)
          )
        )
        .then(rows => rows[0]);

      const quizCompleted = !!progress;

      return {
        isQuizQuestion: true,
        quizCompleted,
        quizId: detectedQuizId,
        hasIncompleteQuizzes
      };
    }

    // If asking for answers with quiz context but no specific quiz detected, still protect
    if (isAskingForAnswer && hasQuizContext && hasIncompleteQuizzes) {
      return {
        isQuizQuestion: true,
        quizCompleted: false,
        quizId: null,
        hasIncompleteQuizzes: true
      };
    }

    return {
      isQuizQuestion: false,
      quizCompleted: true,
      hasIncompleteQuizzes
    };

  } catch (error) {
    console.error('Error checking quiz questions:', error);
    // On error, allow the AI to respond normally
    return { isQuizQuestion: false, quizCompleted: true, hasIncompleteQuizzes: false };
  }
}

