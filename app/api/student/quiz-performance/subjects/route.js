import { db } from '@/config/db';
import { studentProgressTable, quizzesTable, coursesTable } from '@/config/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("📊 Fetching weekly subject performance for user:", userId);

    // Get last 6 weeks of data
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42); // 6 weeks * 7 days

    // Get all completed quizzes in the last 6 weeks
    const quizAttempts = await db
      .select({
        course_id: coursesTable.id,
        course_title: coursesTable.title,
        score: studentProgressTable.score,
        submitted_at: studentProgressTable.submitted_at,
        week: sql`DATE_TRUNC('week', ${studentProgressTable.submitted_at})`.as('week')
      })
      .from(studentProgressTable)
      .innerJoin(quizzesTable, eq(studentProgressTable.quiz_id, quizzesTable.id))
      .innerJoin(coursesTable, eq(quizzesTable.course_id, coursesTable.id))
      .where(
        and(
          eq(studentProgressTable.student_id, userId),
          eq(studentProgressTable.completed, true),
          gte(studentProgressTable.submitted_at, sixWeeksAgo)
        )
      )
      .orderBy(sql`week`);

    console.log("📈 Raw quiz attempts:", quizAttempts.length);

    if (quizAttempts.length === 0) {
      return NextResponse.json({
        weeklyData: [],
        subjects: [],
        totalWeeks: 0
      });
    }

    // Group by week and subject
    const weeklyData = processWeeklyData(quizAttempts);
    const subjects = [...new Set(quizAttempts.map(attempt => attempt.course_title))];

    console.log("✅ Processed weekly data:", weeklyData);
    return NextResponse.json({
      weeklyData,
      subjects,
      totalWeeks: weeklyData.length
    });

  } catch (error) {
    console.error('❌ Error fetching weekly performance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch performance data',
      details: error.message 
    }, { status: 500 });
  }
}

function processWeeklyData(attempts) {
  const weeksMap = new Map();
  
  // Group attempts by week
  attempts.forEach(attempt => {
    const weekStart = new Date(attempt.week);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeksMap.has(weekKey)) {
      weeksMap.set(weekKey, {
        week: weekKey,
        weekLabel: getWeekLabel(weekStart),
        subjects: {}
      });
    }
    
    const weekData = weeksMap.get(weekKey);
    const subject = attempt.course_title;
    
    if (!weekData.subjects[subject]) {
      weekData.subjects[subject] = {
        scores: [],
        average: 0
      };
    }
    
    weekData.subjects[subject].scores.push(attempt.score);
  });
  
  // Calculate averages and format data
  const weeklyData = Array.from(weeksMap.values())
    .sort((a, b) => new Date(a.week) - new Date(b.week))
    .map(week => {
      // Calculate average for each subject
      Object.keys(week.subjects).forEach(subject => {
        const scores = week.subjects[subject].scores;
        week.subjects[subject].average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      });
      
      return week;
    });

  // Ensure we have exactly 6 weeks of data
  return weeklyData.slice(-6);
}

function getWeekLabel(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return `Week ${diffWeeks}`;
}