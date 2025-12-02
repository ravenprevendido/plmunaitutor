import { db } from '@/config/db';
import { studentNotificationsTable } from '@/config/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id') || userId;
    
    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await db
      .select()
      .from(studentNotificationsTable)
      .where(eq(studentNotificationsTable.student_id, studentId))
      .orderBy(desc(studentNotificationsTable.created_at))
      .limit(50); // Increased limit to show more notifications

    // Fetch teacher emails for each notification
    const notificationsWithTeacherEmail = await Promise.all(
      notifications.map(async (notification) => {
        if (!notification.course_id) return notification;
        
        try {
          const { coursesTable, teachersTable } = await import('@/config/schema');
          const { eq } = await import('drizzle-orm');
          const courseData = await db
            .select({
              teacher_email: teachersTable.email,
              course_title: coursesTable.title
            })
            .from(coursesTable)
            .leftJoin(teachersTable, eq(coursesTable.assigned_teacher_id, teachersTable.email))
            .where(eq(coursesTable.id, notification.course_id))
            .then(rows => rows[0]);
          
          return {
            ...notification,
            teacher_email: courseData?.teacher_email || null,
            course_title: courseData?.course_title || null
          };
        } catch (err) {
          return notification;
        }
      })
    );

    return NextResponse.json(notificationsWithTeacherEmail);

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    const { notificationId, studentId: studentIdParam } = await request.json();
    
    const studentId = studentIdParam || userId;
    
    if (!studentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark notification as read
    const updated = await db
      .update(studentNotificationsTable)
      .set({ is_read: true })
      .where(
        and(
          eq(studentNotificationsTable.id, notificationId),
          eq(studentNotificationsTable.student_id, studentId)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { 
      student_id, 
      course_id, 
      teacher_name, 
      teacher_email, // New: teacher email for mailto links
      message, 
      type, 
      quiz_title, 
      lesson_title,
      assignment_title,
      deadline,
      student_email,
      course_title
    } = await request.json();

    const itemTitle = quiz_title || lesson_title || assignment_title || 'New Item';
    const notificationMessage = message || `New ${type}: ${itemTitle}`;

    // If teacher_email not provided, try to fetch it from course
    let finalTeacherEmail = teacher_email;
    if (!finalTeacherEmail && course_id) {
      try {
        const { coursesTable, teachersTable } = await import('@/config/schema');
        const { eq } = await import('drizzle-orm');
        const courseData = await db
          .select({
            teacher_email: teachersTable.email
          })
          .from(coursesTable)
          .leftJoin(teachersTable, eq(coursesTable.assigned_teacher_id, teachersTable.email))
          .where(eq(coursesTable.id, course_id))
          .then(rows => rows[0]);
        if (courseData?.teacher_email) {
          finalTeacherEmail = courseData.teacher_email;
        }
      } catch (err) {
        // Could not fetch teacher email
      }
    }

    // Create in-app notification
    // Note: teacher_email will be stored in a JSON field or we'll fetch it when needed
    const notification = await db
      .insert(studentNotificationsTable)
      .values({
        student_id,
        course_id,
        teacher_name,
        message: notificationMessage,
        type: type || 'quiz',
        is_read: false
      })
      .returning();
    
    // Store teacher_email in notification metadata (we'll add it to the response)
    const notificationWithEmail = {
      ...notification[0],
      teacher_email: finalTeacherEmail,
      course_title: course_title,
      deadline: deadline
    };

    // Send email notification if student email is provided AND email service is configured
    // NOTE: Email is OPTIONAL - in-app notifications work perfectly without email
    if (student_email && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Import and call email service directly
        const { sendEmailNotification } = await import('../send-email/service');
        await sendEmailNotification({
          to: student_email,
          type: type,
          courseTitle: course_title || 'Course',
          itemTitle: itemTitle,
          deadline: deadline,
          teacherName: teacher_name || 'Teacher'
        });
      } catch (emailError) {
        console.error('Error sending email notification (non-critical):', emailError);
        // Don't fail the notification creation if email fails
        // In-app notifications are the primary method and work without email
      }
    }

    return NextResponse.json(notificationWithEmail);

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}