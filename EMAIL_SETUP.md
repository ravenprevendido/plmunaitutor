# Email Notifications Setup Guide

## Overview
The system now sends email notifications to students when teachers create:
- New Lessons
- New Quizzes
- New Assignments

## Setup Instructions

### 1. Choose Your Email Provider
You can use any SMTP-compatible email service:
- **Gmail** (requires App Password)
- **Outlook/Hotmail**
- **SendGrid** (SMTP)
- **Mailgun** (SMTP)
- **Amazon SES** (SMTP)
- **Custom SMTP Server**

### 2. Configure Environment Variables
Add these to your `.env` file:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server host
SMTP_PORT=587                      # SMTP port (587 for TLS, 465 for SSL, 25 for unencrypted)
SMTP_SECURE=false                  # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com     # Your email address
SMTP_PASS=your-app-password        # Your email password or app password
SMTP_FROM_EMAIL=PLMun AI Tutor <your-email@gmail.com>  # From email address
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

### 3. Gmail Setup (Example)
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Use this password in `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_EMAIL=PLMun AI Tutor <your-email@gmail.com>
```

### 4. Outlook/Hotmail Setup
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=PLMun AI Tutor <your-email@outlook.com>
```

### 5. SendGrid Setup (Example)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_EMAIL=PLMun AI Tutor <verified-email@yourdomain.com>
```

### 6. Testing
- If SMTP settings are not configured, emails won't be sent but notifications will still be created in the dashboard
- Check console logs for email sending status
- Test with a single email first before sending to all students

## Features
- ✅ Automatic email notifications for all enrolled students
- ✅ Beautiful HTML email templates
- ✅ Includes deadlines and direct links to content
- ✅ Graceful fallback if email service is not configured
- ✅ Dashboard notifications still work even without email

## Email Templates
Each notification type has a custom-designed email template:
- **Lessons**: Green theme with lesson icon
- **Quizzes**: Blue theme with quiz icon and deadline
- **Assignments**: Purple theme with assignment icon and deadline

