// app/api/admin/recent-activity/route.js
import { db } from '@/config/db';
import { 
  studentProgressTable, 
  quizzesTable, 
  coursesTable, 
  lessonsTable,
  teachersTable,
  enrollmentsTable
} from '@/config/schema';
import { eq, and, desc, isNotNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const activities = [];

    // 1. Get recent quiz completions by students
    const recentQuizCompletions = await db
      .select({
        student_name: enrollmentsTable.student_name,
        quiz_title: quizzesTable.title,
        course_title: coursesTable.title,
        completed_at: studentProgressTable.created_at
      })
      .from(studentProgressTable)
      .innerJoin(quizzesTable, eq(studentProgressTable.quiz_id, quizzesTable.id))
      .innerJoin(coursesTable, eq(studentProgressTable.course_id, coursesTable.id))
      .innerJoin(enrollmentsTable, and(
        eq(studentProgressTable.student_id, enrollmentsTable.student_id),
        eq(studentProgressTable.course_id, enrollmentsTable.course_id)
      ))
      .where(
        and(
          eq(studentProgressTable.completed, true),
          isNotNull(studentProgressTable.quiz_id)
        )
      )
      .orderBy(desc(studentProgressTable.created_at))
      .limit(10);

    recentQuizCompletions.forEach(activity => {
      activities.push({
        icon: "✅",
        text: `Student ${activity.student_name} completed the quiz "${activity.quiz_title}"`,
        course: activity.course_title,
        time: activity.completed_at,
        type: 'quiz_completed'
      });
    });

    // 2. Get recent quizzes created by teachers
    const recentQuizzesCreated = await db
      .select({
        quiz_title: quizzesTable.title,
        course_title: coursesTable.title,
        teacher_name: teachersTable.name,
        created_at: quizzesTable.created_at
      })
      .from(quizzesTable)
      .innerJoin(coursesTable, eq(quizzesTable.course_id, coursesTable.id))
      .leftJoin(teachersTable, eq(coursesTable.assigned_teacher_id, teachersTable.email))
      .orderBy(desc(quizzesTable.created_at))
      .limit(10);

    recentQuizzesCreated.forEach(activity => {
      activities.push({
        icon: "📝",
        text: `Teacher ${activity.teacher_name || 'Unknown'} created a quiz titled "${activity.quiz_title}"`,
        course: activity.course_title,
        time: activity.created_at,
        type: 'quiz_created'
      });
    });

    // 3. Get recent lessons created by teachers
    const recentLessonsCreated = await db
      .select({
        lesson_title: lessonsTable.title,
        course_title: coursesTable.title,
        teacher_name: teachersTable.name,
        created_at: lessonsTable.created_at
      })
      .from(lessonsTable)
      .innerJoin(coursesTable, eq(lessonsTable.course_id, coursesTable.id))
      .leftJoin(teachersTable, eq(coursesTable.assigned_teacher_id, teachersTable.email))
      .orderBy(desc(lessonsTable.created_at))
      .limit(5);

    recentLessonsCreated.forEach(activity => {
      activities.push({
        icon: "📚",
        text: `Teacher ${activity.teacher_name || 'Unknown'} created a lesson "${activity.lesson_title}"`,
        course: activity.course_title,
        time: activity.created_at,
        type: 'lesson_created'
      });
    });

    // Sort all activities by time (most recent first) and limit to 10
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivities = activities.slice(0, 10);

    // Format time for each activity
    const formattedActivities = recentActivities.map(activity => {
      const time = new Date(activity.time);
      const now = new Date();
      const diff = now - time;
      
      let timeAgo = '';
      if (diff < 60000) {
        timeAgo = 'Just now';
      } else if (diff < 3600000) {
        timeAgo = `${Math.floor(diff / 60000)} minutes ago`;
      } else if (diff < 86400000) {
        timeAgo = `${Math.floor(diff / 3600000)} hours ago`;
      } else if (diff < 604800000) {
        timeAgo = `${Math.floor(diff / 86400000)} days ago`;
      } else {
        timeAgo = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      return {
        icon: activity.icon,
        text: activity.text,
        time: timeAgo,
        course: activity.course,
        type: activity.type
      };
    });

    return NextResponse.json(formattedActivities);

  } catch (error) {
    console.error('❌ Error fetching recent activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

