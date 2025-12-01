# Simple Email Setup - Emails to Student Inboxes

## Understanding Email Delivery

**Important:** To send emails that appear in student inboxes (Gmail, Outlook, etc.), you **MUST** use SMTP. This is not an "API" - it's the **standard email protocol** (like how websites use HTTP).

Think of it this way:
- **SMTP** = The email delivery system (like postal service)
- **Nodemailer** = Just a tool to use SMTP (like a mail truck)
- **Gmail SMTP** = Free email server (like a post office)

## ✅ The Simplest Solution: Gmail SMTP (FREE)

This uses Gmail's **free built-in email server** - no external APIs, no paid services.

### Quick Setup (3 Steps, 5 Minutes)

#### Step 1: Get Gmail App Password

1. Go to: https://myaccount.google.com/security
2. Enable **"2-Step Verification"** (if not already enabled)
3. Click **"App passwords"**
4. Create password for **"Mail"** → **"Other"** → Name it "PLMun Tutor"
5. **Copy the 16-character password**

#### Step 2: Add to `.env` File

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
SMTP_FROM_EMAIL=PLMun AI Tutor <your-email@gmail.com>
```

**Replace:**
- `your-email@gmail.com` → Your Gmail address
- `xxxx-xxxx-xxxx-xxxx` → The 16-character app password from Step 1

#### Step 3: Restart Server

```bash
npm run dev
```

## ✅ Done! Emails Now Work

When a teacher creates content:
- ✅ **In-app notification** appears (always works)
- ✅ **Email appears in student's Gmail inbox** (now works!)
- ✅ **No external services**
- ✅ **Completely free**
- ✅ **Uses Gmail's own email server**

## How It Works

```
Teacher creates quiz
    ↓
System uses Gmail SMTP (free)
    ↓
Email sent through Gmail servers
    ↓
Student receives email in Gmail inbox
```

**This is the standard way all email works** - even Gmail itself uses SMTP to send emails!

## Why This Is Different From "APIs"

- **SMTP** = Email protocol (built into internet)
- **Email APIs** = Paid services (SendGrid, Mailgun) that also use SMTP
- **Gmail SMTP** = Free, built-in, no signup needed

You're using Gmail's **free email server**, not a third-party API.

## Limits

- **Free Gmail**: 500 emails/day
- **Gmail Workspace**: Unlimited ($6/month)

## Example: What Students See

**In their Gmail inbox:**
```
From: PLMun AI Tutor <your-email@gmail.com>
Subject: 📝 New Quiz: JavaScript Basics - Web Development

Hello,

Your teacher Anime has created a new quiz for the course Web Development.

Quiz: JavaScript Basics
Due: December 15, 2024

[View Quiz Button]
```

## Troubleshooting

**"Invalid login"**
→ Use App Password, not regular password

**"Connection failed"**
→ Check firewall allows port 587

**Emails in spam**
→ Send test emails first, ask students to mark as "Not Spam"

## Summary

✅ **Free** - No cost
✅ **Simple** - 3 steps, 5 minutes
✅ **Standard** - Uses email protocol (SMTP)
✅ **Direct** - Emails appear in student inboxes
✅ **No external APIs** - Uses Gmail's built-in server

This is how email works - there's no way around using SMTP, but Gmail provides it **completely free**!

