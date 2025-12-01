// app/api/ai/check-quiz-questions/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { checkQuizQuestions } from './utils';

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { prompt, userId: userIdFromBody } = await request.json();
    
    // Use userId from auth if available, otherwise from body
    const studentId = userId || userIdFromBody;

    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await checkQuizQuestions(studentId, prompt);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking quiz questions:', error);
    // On error, allow the AI to respond normally
    return NextResponse.json({ isQuizQuestion: false, quizCompleted: true });
  }
}

