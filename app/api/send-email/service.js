import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // Check if email service is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // For Gmail, you might need:
    // service: 'gmail',
    // auth: {
    //   user: process.env.SMTP_USER,
    //   pass: process.env.SMTP_PASS, // App password for Gmail
    // },
  });
};

export async function sendEmailNotification({ to, type, courseTitle, itemTitle, deadline, teacherName }) {
  // Check if email service is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('📧 Email not sent - SMTP not configured');
    return { sent: false, message: 'Email service not configured' };
  }

  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, message: 'Failed to create email transporter' };
  }

  let emailSubject;
  let emailHtml;

  if (type === 'new_lesson') {
    emailSubject = `📚 New Lesson: ${itemTitle} - ${courseTitle}`;
    emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .info-box { background: #dcfce7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            h2 { color: #166534; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 New Lesson Available!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your teacher <strong>${teacherName || 'Teacher'}</strong> has added a new lesson to the course <strong>${courseTitle}</strong>.</p>
              <div class="info-box">
                <h2 style="margin-top: 0;">${itemTitle}</h2>
                <p><strong>Course:</strong> ${courseTitle}</p>
                <p><strong>Teacher:</strong> ${teacherName || 'Teacher'}</p>
              </div>
              <p>Log in to your dashboard to access the new lesson content and continue your learning journey.</p>
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/workspace/my-courses" class="button">View Lesson</a>
              </div>
              <div class="footer">
                <p>This is an automated notification from PLMun AI Tutor</p>
                <p>You received this email because you are enrolled in ${courseTitle}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  } else if (type === 'new_quiz') {
    const deadlineText = deadline 
      ? `<div class="deadline"><p><strong>⏰ Deadline:</strong> ${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date(deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>`
      : '';
    emailSubject = `📝 New Quiz: ${itemTitle} - ${courseTitle}`;
    emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .deadline { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .info-box { background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
            h2 { color: #1e40af; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 New Quiz Available!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your teacher <strong>${teacherName || 'Teacher'}</strong> has created a new quiz for the course <strong>${courseTitle}</strong>.</p>
              <div class="info-box">
                <h2 style="margin-top: 0;">${itemTitle}</h2>
                <p><strong>Course:</strong> ${courseTitle}</p>
                <p><strong>Teacher:</strong> ${teacherName || 'Teacher'}</p>
              </div>
              ${deadlineText}
              <p>Log in to your dashboard to take the quiz and test your knowledge!</p>
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/workspace/quizzes-assessment" class="button">Take Quiz Now</a>
              </div>
              <div class="footer">
                <p>This is an automated notification from PLMun AI Tutor</p>
                <p>You received this email because you are enrolled in ${courseTitle}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  } else if (type === 'new_assignment') {
    const deadlineText = deadline 
      ? `<div class="deadline"><p><strong>⏰ Deadline:</strong> ${new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date(deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>`
      : '';
    emailSubject = `📋 New Assignment: ${itemTitle} - ${courseTitle}`;
    emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .deadline { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .info-box { background: #f3e8ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
            h2 { color: #6b21a8; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Assignment Available!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your teacher <strong>${teacherName || 'Teacher'}</strong> has created a new assignment for the course <strong>${courseTitle}</strong>.</p>
              <div class="info-box">
                <h2 style="margin-top: 0;">${itemTitle}</h2>
                <p><strong>Course:</strong> ${courseTitle}</p>
                <p><strong>Teacher:</strong> ${teacherName || 'Teacher'}</p>
              </div>
              ${deadlineText}
              <p>Log in to your dashboard to view the assignment details and submit your work.</p>
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/workspace/my-courses" class="button">View Assignment</a>
              </div>
              <div class="footer">
                <p>This is an automated notification from PLMun AI Tutor</p>
                <p>You received this email because you are enrolled in ${courseTitle}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    // Default email template
    emailSubject = `New Update: ${itemTitle} - ${courseTitle}`;
    emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #6b7280; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 New Update!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your teacher <strong>${teacherName || 'Teacher'}</strong> has added new content to the course <strong>${courseTitle}</strong>.</p>
              <h2>${itemTitle}</h2>
              <p>Log in to your dashboard to view the update.</p>
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/workspace/my-courses" class="button">View Update</a>
              <div class="footer">
                <p>This is an automated notification from PLMun AI Tutor</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'PLMun AI Tutor <notifications@yourdomain.com>',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: emailSubject,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', info.messageId);
    return { sent: true, id: info.messageId, response: info.response };
  } catch (error) {
    console.error('Error in sendEmailNotification:', error);
    return { sent: false, error: error.message };
  }
}

