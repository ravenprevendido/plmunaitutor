# Gmail Free Email Setup - Easiest Way to Send Emails

## ✅ Send Emails to Student Inboxes Using Free Gmail SMTP

This is the **easiest and free** way to send emails directly to student inboxes (Gmail, Outlook, etc.) without paying for email services.

## How It Works

1. **Create a Gmail account** for your application (e.g., `plmun.tutor@gmail.com`)
2. **Generate an App Password** (free, takes 2 minutes)
3. **Add credentials to `.env` file**
4. **Done!** Emails will appear in student inboxes automatically

## Step-by-Step Setup (5 Minutes)

### Step 1: Create Gmail Account (if you don't have one)

1. Go to [Gmail](https://gmail.com)
2. Create a new account: `your-app-name@gmail.com`
3. Complete the signup process

### Step 2: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click **"2-Step Verification"**
3. Follow the steps to enable it (required for App Passwords)

### Step 3: Generate App Password



1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under **"How you sign in to Google"**, click **"App passwords"**
3. Select **"Mail"** for app
4. Select **"Other (Custom name)"** for device
5. Enter name: **"PLMun AI Tutor"**
6. Click **"Generate"**
7. **Copy the 16-character password** (you'll see it only once!)

### Step 4: Add to `.env` File

Add these lines to your `.env` file:

```env
# Gmail SMTP Configuration (FREE)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-app-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM_EMAIL=PLMun AI Tutor <your-app-email@gmail.com>
```

**Replace:**
- `your-app-email@gmail.com` → Your Gmail address
- `your-16-char-app-password` → The 16-character password from Step 3

### Step 5: Restart Your Server

```bash
npm run dev
```

## ✅ That's It!

Now when a teacher creates a quiz/lesson/assignment:
- ✅ **In-app notification** appears (always works)
- ✅ **Email appears in student's Gmail inbox** (now works!)
- ✅ **No API keys needed**
- ✅ **Completely free**
- ✅ **Works with any email provider** (Gmail, Outlook, Yahoo, etc.)

## Example Flow


1. **Teacher "Anime" creates quiz** → "JavaScript Basics"
2. **System sends email** using Gmail SMTP
3. **Student "John" opens Gmail** → Sees email in inbox:
   ```
   From: PLMun AI Tutor <plmun.tutor@gmail.com>
   Subject: 📝 New Quiz: JavaScript Basics - Web Development
   Body: Your teacher Anime has created a new quiz...
   ```
4. **Student clicks email** → Opens in Gmail app/web

## Limits

- **Gmail Free Account**: 500 emails/day
- **For more emails**: Use Gmail Workspace ($6/month) or other SMTP services

## Troubleshooting

### "Invalid login" error
- Make sure you're using the **App Password**, not your regular Gmail password
- Verify 2-Step Verification is enabled

### "Connection timeout"
- Check your firewall/network allows port 587
- Try port 465 with `SMTP_SECURE=true`

### Emails going to spam
- Send a few test emails first
- Ask students to mark as "Not Spam"
- Consider using a custom domain email later

## Why This Works

- Uses Gmail's **free SMTP server** (smtp.gmail.com)
- Your app acts as an **email client** (like Outlook)
- Sends emails **through Gmail's servers**
- Students receive emails in their **actual inbox**
- **No external API needed** - just SMTP (which is how all email works)

## Summary

✅ **Free** - No cost
✅ **Easy** - 5 minute setup
✅ **Reliable** - Uses Gmail's infrastructure
✅ **Direct** - Emails appear in student inboxes
✅ **No API keys** - Just Gmail account + App Password

This is the standard way to send emails from applications. Even big companies use SMTP servers (they just use paid services for higher limits).

