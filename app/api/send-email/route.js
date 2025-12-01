import { NextResponse } from 'next/server';
import { sendEmailNotification } from './service';

export async function POST(request) {
  try {
    const { to, type, courseTitle, itemTitle, deadline, teacherName } = await request.json();

    if (!to || !type || !courseTitle || !itemTitle) {
      return NextResponse.json({ error: 'Missing required email fields' }, { status: 400 });
    }

    // Check if email service is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ 
        message: 'Email service not configured. Please set up SMTP settings.',
        sent: false 
      }, { status: 503 });
    }

    const result = await sendEmailNotification({
      to,
      type,
      courseTitle,
      itemTitle,
      deadline,
      teacherName
    });

    if (!result.sent) {
      return NextResponse.json({ 
        message: result.message || 'Failed to send email',
        sent: false,
        error: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Email sent successfully',
      sent: true,
      id: result.id 
    });

  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error.message 
    }, { status: 500 });
  }
}

