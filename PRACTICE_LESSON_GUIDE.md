# Practice Lesson Implementation Guide

## ✅ Implementation Complete

### Overview
Practice lessons are now a separate lesson type that works independently from video lessons. They provide an interactive quiz-style experience with "Next" button flow and automatic answer checking.

---

## 🎯 How to Create Practice Lessons (For Teachers)

### Step 1: Open Add Lesson Modal
1. Go to your course page
2. Click "Add Lesson" or "Create New Lesson"

### Step 2: Select Practice Lesson Type
1. In the "Lesson Type" dropdown, select **"Practice Lesson (exercises only)"**
2. You'll see a message: "Practice lessons focus on exercises and questions only"

### Step 3: Fill in Lesson Details
1. **Lesson Title** (required) - Enter the lesson title
2. **Practice Exercises** (required for practice lessons) - Click "+ Add Exercise"
3. For each exercise:
   - Add Exercise Title
   - Add Exercise Content (optional)
   - Click "+ Add Question" to add questions
   - For each question:
     - Enter question text
     - Add options (A, B, C, D, etc.)
     - Set correct answer (0 = first option, 1 = second, etc.)

### Step 4: Save Lesson
1. Click "Create Lesson"
2. The lesson will be saved with `lesson_type = 'practice'`
3. **Important**: Practice lessons do NOT have video_url

---

## 🎓 How Students Use Practice Lessons

### Accessing Practice Lessons
1. Student clicks on a lesson with Rocket icon (🚀)
2. Automatically routes to `/practice-lesson/[lessonId]`

### Practice Flow
1. **Question Display**: Student sees question with multiple choice options
2. **Select Answer**: Student clicks on an option (A, B, C, or D)
3. **Click "Next"**: 
   - Answer is automatically checked
   - Shows result (✓ Correct or ✗ Incorrect)
   - Correct answer is highlighted in green
4. **Click "Next" Again**: Moves to next question
5. **Progress Tracking**: 
   - Progress shown as "2/5", "3/5", etc. in sidebar
   - Progress circles at top show completion

### Sidebar Features
- Shows all lessons in course
- Practice lessons show progress: "2/5", "7/10"
- Video lessons show duration: "6:21"
- Text lessons show duration or nothing
- Current lesson highlighted in blue
- Completed lessons show checkmark

---

## 🔧 Technical Details

### Lesson Type Detection
```javascript
// Priority order:
1. If video_url exists → Video lesson (always)
2. If lesson_type === 'practice' → Practice lesson
3. Otherwise → Text lesson
```

### Practice Lesson Requirements
- `lesson_type` must be `'practice'`
- Must have `exercises` array with questions
- Should NOT have `video_url`
- Should NOT have `content` (optional)

### Video Lesson Requirements
- `lesson_type` automatically set to `'video'` when video is uploaded
- Must have `video_url`
- Can have exercises (optional)

---

## 📋 Database Schema

### lessonsTable
```javascript
{
  id: serial,
  course_id: integer,
  title: varchar,
  content: text,           // Optional for practice
  video_url: varchar,      // NULL for practice lessons
  lesson_type: varchar,    // 'text', 'video', 'practice'
  exercises: jsonb,        // Required for practice
  summary: text,           // Optional
  key_concepts: jsonb,     // Optional
  duration: integer,       // Optional
  order_index: integer,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 🎨 UI Features

### Practice Lesson Page
- **Header**: "LET'S PRACTICE!" with lesson title
- **Progress Circles**: Shows 1, 2, 3, 4, 5 (or more)
- **Question Display**: Large, clear question text
- **Answer Options**: Clickable cards with letters (A, B, C, D)
- **Next Button**: Blue button that auto-checks answers
- **Result Display**: Green for correct, red for incorrect
- **Sidebar**: Course content with progress indicators

### Visual Feedback
- Selected answer: Blue border
- Correct answer: Green background + checkmark
- Incorrect answer: Red background
- Progress: Real-time updates in sidebar

---

## ✅ Validation

### Teacher Form Validation
- Practice lessons MUST have at least one exercise
- Practice lessons MUST have at least one question per exercise
- Video lessons MUST have video (upload or URL)
- All lessons MUST have title

### Student Experience
- Practice lessons redirect if no questions
- Practice lessons redirect if has video (should be video lesson)
- Video lessons redirect if no video (should be text lesson)

---

## 🔄 Routing Logic

### Lesson Tab Component
```javascript
if (lesson.video_url) {
  → /workspace/my-courses/[courseId]/lesson/[lessonId]  // Video
} else if (lesson.lesson_type === 'practice') {
  → /workspace/my-courses/[courseId]/practice-lesson/[lessonId]  // Practice
} else {
  → /workspace/my-courses/[courseId]/text-lesson/[lessonId]  // Text
}
```

---

## 🐛 Troubleshooting

### Practice Lesson Not Loading
1. Check `lesson_type` is set to `'practice'`
2. Check `video_url` is NULL or empty
3. Check `exercises` array has questions
4. Check browser console for errors

### Wrong Lesson Type Showing
1. If video exists → Always video lesson (by design)
2. If practice selected but video uploaded → Becomes video lesson
3. Check database: `SELECT lesson_type, video_url FROM lessons WHERE id = ?`

### Progress Not Updating
1. Check API endpoint: `/api/courses/[id]/lessons/[lessonId]/progress`
2. Check `completed_exercises` array in progress
3. Check browser console for API errors

---

## 📝 Notes

- **Video lessons are preserved**: All existing video lesson functionality remains unchanged
- **Practice lessons are separate**: They don't interfere with video or text lessons
- **Auto-detection**: Video lessons are automatically detected when video is uploaded
- **Backward compatible**: Existing lessons without `lesson_type` work fine

---

## 🎯 Summary

Practice lessons provide a quiz-style learning experience:
- ✅ Separate from video lessons
- ✅ "Next" button with auto-checking
- ✅ Progress tracking (2/5, 7/10)
- ✅ Sidebar with lesson structure
- ✅ Visual feedback for answers
- ✅ Video lessons remain unchanged

