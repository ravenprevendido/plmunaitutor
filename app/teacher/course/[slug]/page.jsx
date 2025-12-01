// app/teacher/course/[slug]/page.jsx
"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { BookOpen, FileText, Megaphone, Users, BarChart2, Trash2, Edit, Lightbulb, X, Plus, Clock, Sparkles } from "lucide-react";

const CoursePage = () => {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState("Lesson");
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: "",
    content: "",
    video_url: "",
    video_file: null,
    lesson_type: "text", // 'text', 'video', 'practice'
    summary: "",
    key_concepts: [""],
    exercises: [],
    duration: "",
    order_index: 0
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Quiz states
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    deadline: "",
    topic: "",
    difficulty: "beginner",
    numberOfQuestions: 5
  });


  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  
  // Assignment states
  const [assignmentData, setAssignmentData] = useState({
    title: "",
    description: "",
    deadline: "",
    attachment: null
  });
  const [generatingAssignment, setGeneratingAssignment] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [slug]);

  

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      console.log(`📚 Fetching course with slug: ${slug}`);
      
      const courseResponse = await fetch(`/api/courses?slug=${slug}`);
      
      if (!courseResponse.ok) {
        console.error(`❌ Failed to fetch course: ${courseResponse.status}`);
        setLoading(false);
        return;
      }
      
      const courseData = await courseResponse.json();
      
      if (!courseData || courseData.length === 0) {
        console.error(`❌ No course found with slug: ${slug}`);
        setLoading(false);
        return;
      }
      
      const fetchedCourse = courseData[0];
      console.log(`✅ Found course: ${fetchedCourse.title} (ID: ${fetchedCourse.id})`);
      console.log(`👨‍🏫 Assigned teacher: ${fetchedCourse.assigned_teacher_id || 'Not assigned'}`);
      
      setCourse(fetchedCourse);
      
      // Fetch course-specific content using the correct course ID
      console.log(`📖 Fetching content for course ID: ${fetchedCourse.id}`);
      const [lessonsRes, quizzesRes, assignmentsRes, announcementsRes, studentsRes] = await Promise.all([
        fetch(`/api/courses/${fetchedCourse.id}/lessons`),
        fetch(`/api/courses/${fetchedCourse.id}/quizzes`),
        fetch(`/api/courses/${fetchedCourse.id}/assignments`),
        fetch(`/api/courses/${fetchedCourse.id}/announcements`),
        fetch(`/api/courses/${fetchedCourse.id}/students`)
      ]);
      
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        console.log(`✅ Found ${lessonsData.length} lessons for course ${fetchedCourse.id}`);
        setLessons(lessonsData);
      }
      
      if (quizzesRes.ok) {
        const quizzesData = await quizzesRes.json();
        console.log(`✅ Found ${quizzesData.length} quizzes for course ${fetchedCourse.id}`);
        setQuizzes(quizzesData);
      }
      
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        console.log(`✅ Found ${assignmentsData.length} assignments for course ${fetchedCourse.id}`);
        setAssignments(assignmentsData);
      }
      
      if (announcementsRes.ok) {
        const announcementsData = await announcementsRes.json();
        console.log(`✅ Found ${announcementsData.length} announcements for course ${fetchedCourse.id}`);
        setAnnouncements(announcementsData);
      }
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        console.log(`✅ Found ${studentsData.length} students enrolled in course ${fetchedCourse.id}`);
        setStudents(studentsData);
      }
      
      console.log(`✅ Course data loaded successfully for: ${fetchedCourse.title}`);
    } catch (error) {
      console.error('❌ Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };


  // Lesson Functions
  const handleAddLesson = () => {
    setShowAddLessonModal(true);
  };


  const handleSubmitLesson = async (lessonData) => {
    if (!lessonData.title.trim()) {
      alert("Please enter a lesson title");
      return;
    }
    
    // Validate practice lessons have exercises
    if (lessonData.lesson_type === 'practice' && (!lessonData.exercises || lessonData.exercises.length === 0)) {
      alert("Practice lessons must have at least one exercise with questions. Please add exercises.");
      return;
    }
    
    // Validate video lessons have video
    if (lessonData.lesson_type === 'video' && !lessonData.video_url && !lessonData.video_file) {
      alert("Video lessons must have a video. Please upload a video or provide a video URL.");
      return;
    }

    try {
      let videoUrl = lessonData.video_url;

      // Upload video file if provided
      if (lessonData.video_file) {
        setUploadingVideo(true);
        const formData = new FormData();
        formData.append('video', lessonData.video_file);

        const uploadResponse = await fetch(`/api/courses/${course.id}/lessons/upload-video`, {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          videoUrl = uploadData.video_url;
        } else {
          alert("Error uploading video. Please try again.");
          setUploadingVideo(false);
          return;
        }
        setUploadingVideo(false);
      }

      // Filter out empty key concepts
      const keyConcepts = lessonData.key_concepts.filter(kc => kc.trim() !== "");

      // Determine lesson type: 
      // 1. If video exists, it's ALWAYS a video lesson (preserve existing behavior)
      // 2. If practice is selected and NO video, it's a practice lesson
      // 3. Otherwise, it's a text lesson
      let finalLessonType = lessonData.lesson_type || 'text';
      if (videoUrl && videoUrl.trim() !== '') {
        finalLessonType = 'video'; // Video lessons always have type 'video'
      } else if (lessonData.lesson_type === 'practice') {
        finalLessonType = 'practice'; // Practice lessons (no video)
      } else {
        finalLessonType = 'text'; // Default to text
      }
      
      // For practice lessons, ensure no video_url is set
      if (finalLessonType === 'practice') {
        videoUrl = null;
      }

      const response = await fetch(`/api/courses/${course.id}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: lessonData.title,
          content: lessonData.content,
          video_url: videoUrl,
          lesson_type: finalLessonType,
          summary: lessonData.summary,
          key_concepts: keyConcepts.length > 0 ? keyConcepts : null,
          exercises: lessonData.exercises.length > 0 ? lessonData.exercises : null,
          duration: lessonData.duration ? parseInt(lessonData.duration) : null,
          order_index: lessonData.order_index || 0,
          status: "published"
        })
      });
      
      if (response.ok) {
        const createdLesson = await response.json();
        setLessons(prev => [...prev, createdLesson]);
        
        // Reset form - preserve video lesson type if video was uploaded
        setNewLesson({
          title: "",
          content: "",
          video_url: "",
          video_file: null,
          lesson_type: "text", // Default to text, teacher can change
          summary: "",
          key_concepts: [""],
          exercises: [],
          duration: "",
          order_index: 0
        });
        
        // Close modal
        setShowAddLessonModal(false);
        
        // Notify students about new lesson
        await notifyStudentsAboutNewLesson(lessonData.title);
        
        alert("Lesson created successfully!");
      }
    } catch (error) {
      console.error('Error adding lesson:', error);
      alert("Error creating lesson. Please try again.");
      setUploadingVideo(false);
    }
  };

  // Optimized handlers using useCallback and functional updates
  const addExercise = useCallback(() => {
    setNewLesson(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        id: Date.now(),
        title: "",
        content: "",
        questions: []
      }]
    }));
  }, []);

  const updateExercise = useCallback((exerciseId, field, value) => {
    setNewLesson(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    }));
  }, []);

  const addQuestionToExercise = useCallback((exerciseId) => {
    setNewLesson(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId 
          ? { 
              ...ex, 
              questions: [...(ex.questions || []), {
                id: Date.now(),
                question: "",
                options: ["", "", "", ""],
                correct_answer: 0
              }]
            }
          : ex
      )
    }));
  }, []);

  const updateQuestion = useCallback((exerciseId, questionId, field, value) => {
    setNewLesson(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId
          ? {
              ...ex,
              questions: ex.questions.map(q =>
                q.id === questionId ? { ...q, [field]: value } : q
              )
            }
          : ex
      )
    }));
  }, []);

  const removeExercise = useCallback((exerciseId) => {
    setNewLesson(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }));
  }, []);

  const removeQuestion = useCallback((exerciseId, questionId) => {
    setNewLesson(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId
          ? { ...ex, questions: ex.questions.filter(q => q.id !== questionId) }
          : ex
      )
    }));
  }, []);

  const addKeyConcept = useCallback(() => {
    setNewLesson(prev => ({
      ...prev,
      key_concepts: [...prev.key_concepts, ""]
    }));
  }, []);

  const updateKeyConcept = useCallback((index, value) => {
    setNewLesson(prev => {
      const newConcepts = [...prev.key_concepts];
      newConcepts[index] = value;
      return { ...prev, key_concepts: newConcepts };
    });
  }, []);

  const removeKeyConcept = useCallback((index) => {
    setNewLesson(prev => ({
      ...prev,
      key_concepts: prev.key_concepts.filter((_, i) => i !== index)
    }));
  }, []);

  // Optimized input handlers
  const handleLessonFieldChange = useCallback((field, value) => {
    setNewLesson(prev => ({ ...prev, [field]: value }));
  }, []);

  const notifyStudentsAboutNewLesson = async (lessonTitle) => {
    try {
      console.log(`📧 Starting notification process for lesson: ${lessonTitle}`);
      console.log(`📚 Course: ${course.title} (ID: ${course.id})`);
      console.log(`👨‍🏫 Teacher: ${course.teacher_name || 'Unknown'} (${course.assigned_teacher_id || 'No email'})`);
      
      // Get all students enrolled in THIS SPECIFIC COURSE ONLY
      const studentsResponse = await fetch(`/api/courses/${course.id}/students`);
      if (!studentsResponse.ok) {
        console.error('❌ Failed to fetch students:', studentsResponse.status);
        return;
      }
      
      const students = await studentsResponse.json();
      console.log(`📧 Found ${students.length} enrolled students in course "${course.title}" to notify`);
      console.log(`📋 Students: ${students.map(s => s.student_name).join(', ')}`);
      
      if (students.length === 0) {
        console.log(`⚠️ No enrolled students found for course "${course.title}"`);
        return;
      }
      
      // Create notifications and send emails for each student
      const notificationResults = await Promise.allSettled(
        students.map(async (student) => {
          if (!student.student_email) {
            console.warn(`⚠️ Student ${student.student_name} has no email address`);
            return { success: false, reason: 'No email address' };
          }
          
          try {
            const response = await fetch('/api/student-notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                student_id: student.student_id,
                student_email: student.student_email,
                course_id: course.id,
                course_title: course.title,
                teacher_name: course.teacher_name || "Teacher",
                teacher_email: course.assigned_teacher_id || course.teacher_email || null, // Add teacher email for mailto
                lesson_title: lessonTitle,
                type: 'new_lesson',
                message: `New lesson available: ${lessonTitle}`
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log(`✅ Notification and email sent to ${student.student_name} (${student.student_email})`);
              return { success: true, student: student.student_name, email: student.student_email };
            } else {
              const errorData = await response.json();
              console.error(`❌ Failed to notify ${student.student_name}:`, errorData);
              return { success: false, student: student.student_name, error: errorData };
            }
          } catch (error) {
            console.error(`❌ Error notifying ${student.student_name}:`, error);
            return { success: false, student: student.student_name, error: error.message };
          }
        })
      );
      
      const successful = notificationResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = notificationResults.length - successful;
      console.log(`✅ Notification complete: ${successful} successful, ${failed} failed`);
      console.log("✅ All enrolled students have been notified about the new lesson (dashboard + email)");
    } catch (error) {
      console.error('❌ Error in notifyStudentsAboutNewLesson:', error);
    }

  };

  const handleDeleteLesson = async (lessonId) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      try {
        const response = await fetch(`/api/courses/${course.id}/lessons/${lessonId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
          alert("Lesson deleted successfully!");
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting lesson:', error);
        alert("Error deleting lesson. Please try again.");
      }
    }
  };



  const handleEditLesson = (lesson) => {
    const newTitle = prompt("Enter new lesson title:", lesson.title);
    if (newTitle && newTitle !== lesson.title) {
      // Implement edit functionality
      console.log("Edit lesson:", lesson.id, newTitle);
    }
  };

  // Quiz Functions
  const handleAddQuiz = () => {
    setShowAddQuizModal(true);
    setGeneratedQuiz(null);
    setQuizData({
      title: "",
      description: "",
      deadline: "",
      topic: course?.title || "",
      difficulty: "beginner",
      numberOfQuestions: 5
    });
  };

  const generateQuizWithAI = async () => {
    if (!quizData.topic.trim()) {
      alert("Please enter a topic for the quiz");
      return;
    }

    try {
      setGeneratingQuiz(true);
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: quizData.topic,
          difficulty: quizData.difficulty,
          numberOfQuestions: quizData.numberOfQuestions
        })
      });

      const data = await response.json();
      
      if (data.quiz) {
        setGeneratedQuiz(data.quiz);
        setQuizData(prev => ({
          ...prev,
          title: data.quiz.quizTitle,
          description: data.quiz.description
        }));
      } else {
        alert("Failed to generate quiz. Please try again.");
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert("Error generating quiz. Please try again.");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizData.title.trim() || !generatedQuiz) {
      alert("Please generate a quiz first and ensure all fields are filled");
      return;
    }

    try {
      const response = await fetch(`/api/courses/${course.id}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quizData.title,
          description: quizData.description,
          questions: generatedQuiz.questions,
          deadline: quizData.deadline
        })
      });
      
      if (response.ok) {
        const createdQuiz = await response.json();
        setQuizzes(prev => [...prev, createdQuiz]);
        setShowAddQuizModal(false);
        
        // Notify students about new quiz
        await notifyStudentsAboutNewQuiz(quizData.title);
        
        alert("Quiz created successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert("Error creating quiz. Please try again.");
    }
  };

 const notifyStudentsAboutNewQuiz = async (quizTitle) => {
  try {
    console.log(`📧 Starting notification process for quiz: ${quizTitle}`);
    console.log(`📚 Course: ${course.title} (ID: ${course.id})`);
    console.log(`👨‍🏫 Teacher: ${course.teacher_name || 'Unknown'} (${course.assigned_teacher_id || 'No email'})`);
    
    // Get all students enrolled in THIS SPECIFIC COURSE ONLY
    const studentsResponse = await fetch(`/api/courses/${course.id}/students`);
    if (!studentsResponse.ok) {
      console.error('❌ Failed to fetch students:', studentsResponse.status);
      return;
    }
    
    const students = await studentsResponse.json();
    console.log(`📧 Found ${students.length} enrolled students in course "${course.title}" to notify`);
    console.log(`📋 Students: ${students.map(s => s.student_name).join(', ')}`);
    
    if (students.length === 0) {
      console.log(`⚠️ No enrolled students found for course "${course.title}"`);
      return;
    }
    
    // Create notifications and send emails for each student
    const notificationResults = await Promise.allSettled(
      students.map(async (student) => {
        if (!student.student_email) {
          console.warn(`⚠️ Student ${student.student_name} has no email address`);
          return { success: false, reason: 'No email address' };
        }
        
        try {
          const response = await fetch('/api/student-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: student.student_id,
              student_email: student.student_email,
              course_id: course.id,
              course_title: course.title,
              teacher_name: course.teacher_name || "Teacher",
              teacher_email: course.assigned_teacher_id || course.teacher_email || null, // Add teacher email for mailto
              quiz_title: quizTitle,
              type: 'new_quiz',
              deadline: quizData.deadline,
              message: `New quiz available: ${quizTitle}${quizData.deadline ? ` - Due ${new Date(quizData.deadline).toLocaleDateString()}` : ''}`
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Notification and email sent to ${student.student_name} (${student.student_email})`);
            return { success: true, student: student.student_name, email: student.student_email };
          } else {
            const errorData = await response.json();
            console.error(`❌ Failed to notify ${student.student_name}:`, errorData);
            return { success: false, student: student.student_name, error: errorData };
          }
        } catch (error) {
          console.error(`❌ Error notifying ${student.student_name}:`, error);
          return { success: false, student: student.student_name, error: error.message };
        }
      })
    );
    
    const successful = notificationResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = notificationResults.length - successful;
    
    console.log(`✅ Notification complete: ${successful} successful, ${failed} failed`);
    console.log("✅ All enrolled students have been notified about the new quiz (dashboard + email)");
  } catch (error) {
    console.error('❌ Error in notifyStudentsAboutNewQuiz:', error);
  }
};

  const handleDeleteQuiz = async (quizId) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      try {
        const response = await fetch(`/api/courses/${course.id}/quizzes/${quizId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
          alert("Quiz deleted successfully!");
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert("Error deleting quiz. Please try again.");
      }
    }
  };

  // Assignment Functions
  const generateAssignmentDocument = async () => {
    if (!assignmentData.title.trim()) {
      alert("Please enter an assignment name");
      return;
    }

    try {
      setGeneratingAssignment(true);
      const response = await fetch('/api/ai/generate-assignment-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assignmentData.title,
          topic: assignmentData.title
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignmentData.title.replace(/\s+/g, '_')}_Assignment.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("Assignment document generated and downloaded successfully!");
    } catch (error) {
      console.error('Error generating assignment document:', error);
      alert("Error generating assignment document. Please try again.");
    } finally {
      setGeneratingAssignment(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!assignmentData.title.trim() || !assignmentData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', assignmentData.title);
      formData.append('description', assignmentData.description);
      formData.append('deadline', assignmentData.deadline);
      if (assignmentData.attachment) {
        formData.append('attachment', assignmentData.attachment);
      }

      const response = await fetch(`/api/courses/${course.id}/assignments`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const createdAssignment = await response.json();
        setAssignments(prev => [...prev, createdAssignment]);
        setShowAddAssignmentModal(false);
        setAssignmentData({
          title: "",
          description: "",
          deadline: "",
          attachment: null
        });
        
        // Notify students about new assignment
        await notifyStudentsAboutNewAssignment(assignmentData.title);
        
        alert("Assignment created successfully!");
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert("Error creating assignment. Please try again.");
    }
  };

  const notifyStudentsAboutNewAssignment = async (assignmentTitle) => {
    try {
      console.log(`📧 Starting notification process for assignment: ${assignmentTitle}`);
      console.log(`📚 Course: ${course.title} (ID: ${course.id})`);
      console.log(`👨‍🏫 Teacher: ${course.teacher_name || 'Unknown'} (${course.assigned_teacher_id || 'No email'})`);
      
      // Get all students enrolled in THIS SPECIFIC COURSE ONLY
      const studentsResponse = await fetch(`/api/courses/${course.id}/students`);
      if (!studentsResponse.ok) {
        console.error('❌ Failed to fetch students:', studentsResponse.status);
        return;
      }
      
      const students = await studentsResponse.json();
      console.log(`📧 Found ${students.length} enrolled students in course "${course.title}" to notify`);
      console.log(`📋 Students: ${students.map(s => s.student_name).join(', ')}`);
      
      if (students.length === 0) {
        console.log(`⚠️ No enrolled students found for course "${course.title}"`);
        return;
      }
      
      // Create notifications and send emails for each student
      const notificationResults = await Promise.allSettled(
        students.map(async (student) => {
          if (!student.student_email) {
            console.warn(`⚠️ Student ${student.student_name} has no email address`);
            return { success: false, reason: 'No email address' };
          }
          
          try {
            const response = await fetch('/api/student-notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                student_id: student.student_id,
                student_email: student.student_email,
                course_id: course.id,
                course_title: course.title,
                teacher_name: course.teacher_name || "Teacher",
                teacher_email: course.assigned_teacher_id || course.teacher_email || null, // Add teacher email for mailto
                assignment_title: assignmentTitle,
                type: 'new_assignment',
                deadline: assignmentData.deadline,
                message: `New assignment available: ${assignmentTitle}${assignmentData.deadline ? ` - Due ${new Date(assignmentData.deadline).toLocaleDateString()}` : ''}`
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log(`✅ Notification and email sent to ${student.student_name} (${student.student_email})`);
              return { success: true, student: student.student_name, email: student.student_email };
            } else {
              const errorData = await response.json();
              console.error(`❌ Failed to notify ${student.student_name}:`, errorData);
              return { success: false, student: student.student_name, error: errorData };
            }
          } catch (error) {
            console.error(`❌ Error notifying ${student.student_name}:`, error);
            return { success: false, student: student.student_name, error: error.message };
          }
        })
      );
      
      const successful = notificationResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = notificationResults.length - successful;
      
      console.log(`✅ Notification complete: ${successful} successful, ${failed} failed`);
      console.log("✅ All enrolled students have been notified about the new assignment (dashboard + email)");
    } catch (error) {
      console.error('❌ Error in notifyStudentsAboutNewAssignment:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      try {
        const response = await fetch(`/api/courses/${course.id}/assignments/${assignmentId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
          alert("Assignment deleted successfully!");
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert("Error deleting assignment. Please try again.");
      }
    }
  };

  // Add Lesson Modal Component
  const AddLessonModal = () => {
    if (!showAddLessonModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-[#161b22] border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] my-4">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-[#161b22] z-10">
            <h2 className="text-xl font-bold text-white">Add New Lesson</h2>
            <button 
              onClick={() => setShowAddLessonModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Lesson Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lesson Title *
              </label>
              <input
                type="text"
                value={newLesson.title}
                onChange={(e) => handleLessonFieldChange('title', e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="Enter lesson title"
                required
              />
            </div>

            {/* Lesson Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lesson Type *
              </label>
              <select
                value={newLesson.lesson_type}
                onChange={(e) => handleLessonFieldChange('lesson_type', e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
              >
                <option value="text">Text Lesson (with content)</option>
                <option value="video">Video Lesson (with video)</option>
                <option value="practice">Practice Lesson (exercises only)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {newLesson.lesson_type === 'practice' 
                  ? 'Practice lessons focus on exercises and questions only'
                  : newLesson.lesson_type === 'video'
                  ? 'Video lessons include video content'
                  : 'Text lessons include written content'}
              </p>
            </div>

            {/* Video Upload or URL - Only show for video lessons */}
            {newLesson.lesson_type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video (Upload or URL) *
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleLessonFieldChange('video_file', e.target.files[0])}
                  className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                />
                <p className="text-xs text-gray-400">OR</p>
                <input
                  type="url"
                  value={newLesson.video_url}
                  onChange={(e) => handleLessonFieldChange('video_url', e.target.value)}
                  className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="https://example.com/video"
                />
              </div>
            </div>
            )}

            {/* Lesson Content - Only show for text lessons */}
            {newLesson.lesson_type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lesson Content
              </label>
              <textarea
                value={newLesson.content}
                onChange={(e) => handleLessonFieldChange('content', e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 min-h-[100px]"
                placeholder="Enter lesson content (optional)"
                rows="4"
              />
            </div>
            )}

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lesson Summary/Recap
              </label>
              <textarea
                value={newLesson.summary}
                onChange={(e) => handleLessonFieldChange('summary', e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 min-h-[80px]"
                placeholder="Brief summary of what students will learn (optional)"
                rows="3"
              />
            </div>

            {/* Key Concepts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Key Concepts
                </label>
                <button
                  type="button"
                  onClick={addKeyConcept}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  + Add Concept
                </button>
              </div>
              {newLesson.key_concepts.map((concept, index) => (
                <div key={`concept-${index}`} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={concept}
                    onChange={(e) => updateKeyConcept(index, e.target.value)}
                    className="flex-1 bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    placeholder="Key concept"
                  />
                  {newLesson.key_concepts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKeyConcept(index)}
                      className="text-red-400 hover:text-red-300 px-2"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={newLesson.duration}
                onChange={(e) => handleLessonFieldChange('duration', e.target.value)}
                className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="e.g., 15"
                min="1"
              />
            </div>

            {/* Practice Exercises - Required for practice lessons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Practice Exercises {newLesson.lesson_type === 'practice' && <span className="text-red-400">*</span>}
                </label>
                <button
                  type="button"
                  onClick={addExercise}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  + Add Exercise
                </button>
              </div>
              <div className="space-y-4">
                {newLesson.exercises.map((exercise, exIndex) => (
                  <div key={exercise.id} className="bg-[#0d1117] border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-300">Exercise {exIndex + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeExercise(exercise.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={exercise.title}
                        onChange={(e) => updateExercise(exercise.id, 'title', e.target.value)}
                        className="w-full bg-[#161b22] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                        placeholder="Exercise title"
                      />
                      <textarea
                        value={exercise.content}
                        onChange={(e) => updateExercise(exercise.id, 'content', e.target.value)}
                        className="w-full bg-[#161b22] border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                        placeholder="Exercise content/instructions"
                        rows="3"
                      />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">Questions</span>
                          <button
                            type="button"
                            onClick={() => addQuestionToExercise(exercise.id)}
                            className="text-xs text-green-400 hover:text-green-300"
                          >
                            + Add Question
                          </button>
                        </div>
                        {exercise.questions?.map((question, qIndex) => (
                          <div key={`question-${exercise.id}-${question.id}`} className="bg-[#161b22] border border-gray-700 rounded p-3 mb-2">
                            <div className="flex justify-between mb-2">
                              <span className="text-xs text-gray-400">Question {qIndex + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeQuestion(exercise.id, question.id)}
                                className="text-xs text-red-400"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => updateQuestion(exercise.id, question.id, 'question', e.target.value)}
                              className="w-full bg-[#0d1117] border border-gray-600 rounded px-2 py-1 text-white text-sm mb-2"
                              placeholder="Question text"
                            />
                            <div className="space-y-1">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct-${exercise.id}-${question.id}`}
                                    checked={question.correct_answer === optIndex}
                                    onChange={() => updateQuestion(exercise.id, question.id, 'correct_answer', optIndex)}
                                    className="text-green-500"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...question.options];
                                      newOptions[optIndex] = e.target.value;
                                      updateQuestion(exercise.id, question.id, 'options', newOptions);
                                    }}
                                    className="flex-1 bg-[#0d1117] border border-gray-600 rounded px-2 py-1 text-white text-xs"
                                    placeholder={`Option ${optIndex + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Index */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Order Index
              </label>
              <input
                type="number"
                value={newLesson.order_index}
                onChange={(e) => handleLessonFieldChange('order_index', parseInt(e.target.value) || 0)}
                className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                min="0"
              />
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-700 sticky bottom-0 bg-[#161b22]">
            <button
              type="button"
              onClick={() => setShowAddLessonModal(false)}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmitLesson(newLesson)}
              disabled={uploadingVideo}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploadingVideo ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <BookOpen size={16} />
                  Create Lesson
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add Assignment Modal Component
  const AddAssignmentModal = () => {
    if (!showAddAssignmentModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#161b22] border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-white">Add Assignment</h2>
              <p className="text-sm text-gray-400 mt-1">Please add assignment contents below</p>
            </div>
            <button 
              onClick={() => setShowAddAssignmentModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Assignment Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assignment Name *
              </label>
              <input
                type="text"
                value={assignmentData.title}
                onChange={(e) => setAssignmentData({...assignmentData, title: e.target.value})}
                className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="Enter assignment name"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Add Description *
              </label>
              <textarea
                value={assignmentData.description}
                onChange={(e) => setAssignmentData({...assignmentData, description: e.target.value})}
                className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 min-h-[120px]"
                placeholder="Enter assignment description"
                rows="5"
                required
              />
            </div>

            {/* Time Duration / Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Duration (Deadline) *
              </label>
              <input
                type="datetime-local"
                value={assignmentData.deadline}
                onChange={(e) => setAssignmentData({...assignmentData, deadline: e.target.value})}
                className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                required
              />
            </div>

            {/* Attachment File */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Attachment File
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                <input
                  type="file"
                  id="assignment-file"
                  onChange={(e) => setAssignmentData({...assignmentData, attachment: e.target.files[0]})}
                  className="hidden"
                  accept=".png,.jpeg,.jpg,.gif,.plain,.html,.docx,.pdf"
                />
                <label htmlFor="assignment-file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl text-gray-400">📎</div>
                    <p className="text-gray-300 text-sm">
                      Drag and drop a file, or <span className="text-blue-400 font-semibold">Browse</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      Allowed file types: PNG, JPEG, JPG, GIF, PLAIN, HTML, DOCX, PDF
                    </p>
                    <p className="text-gray-500 text-xs">
                      Maximum file size 1GB
                    </p>
                    {assignmentData.attachment && (
                      <p className="text-green-400 text-sm mt-2">
                        Selected: {assignmentData.attachment.name}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-700">
            <button
              type="button"
              onClick={generateAssignmentDocument}
              disabled={generatingAssignment || !assignmentData.title.trim()}
              className={`p-2 rounded-lg transition-colors ${
                generatingAssignment 
                  ? 'bg-green-700 cursor-not-allowed text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title="Generate Assignment Document with AI"
            >
              {generatingAssignment ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Sparkles size={20} />
              )}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddAssignmentModal(false);
                  setAssignmentData({
                    title: "",
                    description: "",
                    deadline: "",
                    attachment: null
                  });
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors bg-[#0d1117] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAssignment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add Quiz Modal Component
  const AddQuizModal = () => {
    if (!showAddQuizModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#161b22] border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Create New Quiz</h2>
            <button 
              onClick={() => setShowAddQuizModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Quiz Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quiz Topic *
                </label>
                <input
                  type="text"
                  value={quizData.topic}
                  onChange={(e) => setQuizData({...quizData, topic: e.target.value})}
                  className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                  placeholder="Enter quiz topic"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={quizData.difficulty}
                  onChange={(e) => setQuizData({...quizData, difficulty: e.target.value})}
                  className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Questions
                </label>
                <select
                  value={quizData.numberOfQuestions}
                  onChange={(e) => setQuizData({...quizData, numberOfQuestions: parseInt(e.target.value)})}
                  className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="3">3 Questions</option>
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                  <option value="15">15 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={quizData.deadline}
                  onChange={(e) => setQuizData({...quizData, deadline: e.target.value})}
                  className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <button
                onClick={generateQuizWithAI}
                disabled={generatingQuiz || !quizData.topic.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  generatingQuiz 
                    ? 'bg-green-700 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {generatingQuiz ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating Quiz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Quiz with AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Quiz Preview */}
            {generatedQuiz && (
              <div className="border border-green-500 rounded-lg p-4 bg-green-900/20">
                <h3 className="text-lg font-semibold text-green-400 mb-4">Generated Quiz Preview</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      value={quizData.title}
                      onChange={(e) => setQuizData({...quizData, title: e.target.value})}
                      className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={quizData.description}
                      onChange={(e) => setQuizData({...quizData, description: e.target.value})}
                      className="w-full bg-[#0d1117] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500 min-h-[80px]"
                    />
                  </div>

                  {/* Questions Preview */}
                  <div>
                    <h4 className="font-semibold text-white mb-3">Questions:</h4>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {generatedQuiz.questions.map((q, index) => (
                        <div key={index} className="bg-[#1a1f29] p-4 rounded-lg">
                          <p className="text-white font-medium mb-2">
                            {index + 1}. {q.question}
                          </p>
                          <div className="space-y-1 ml-4">
                            {q.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                                  optIndex === q.correctAnswer 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-600 text-gray-300'
                                }`}>
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span className={`${
                                  optIndex === q.correctAnswer ? 'text-green-400 font-semibold' : 'text-gray-300'
                                }`}>
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowAddQuizModal(false)}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitQuiz}
              disabled={!generatedQuiz}
              className={`bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                !generatedQuiz ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
              }`}
            >
              <FileText size={16} />
              Create Quiz
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Lesson":
        return (
          <div className="p-4">
            {lessons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-600" />
                <p>No lessons created yet</p>
                <button 
                  onClick={handleAddLesson}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Create Your First Lesson
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-gray-300 text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 uppercase text-xs">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Date Created</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="border-b border-gray-800 hover:bg-[#1c2128] transition">
                      <td className="py-3 px-4">{lesson.title}</td>
                      <td className="py-3 px-4">{lesson.order_index}</td>
                      <td className="py-3 px-4">{new Date(lesson.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          lesson.status === 'published' ? 'bg-green-500 text-white' : 'bg-gray-500 text-gray-300'
                        }`}>
                          {lesson.status || 'Published'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right flex items-center justify-end gap-3">
                        <button 
                          onClick={() => handleEditLesson(lesson)}
                          className="hover:text-green-500 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case "Quiz":
        return (
          <div className="p-4">
            {quizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-600" />
                <p>No quizzes created yet</p>
                <button 
                  onClick={handleAddQuiz}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 mx-auto"
                >
                  <Plus size={16} />
                  Create Your First Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-[#1a1f29] border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{quiz.title}</h3>
                        <p className="text-gray-400 text-sm mb-3">{quiz.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FileText size={14} />
                            <span>{quiz.questions?.length || 0} questions</span>
                          </div>
                          
                          {quiz.deadline && (
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>Due: {new Date(quiz.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <span>Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                          View Results
                        </button>
                        <button 
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "Assignments":
        return (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Assignments</h3>
              <button
                onClick={() => setShowAddAssignmentModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Add Assignment
              </button>
            </div>
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-600" />
                <p>No assignments created yet</p>
                <button
                  onClick={() => setShowAddAssignmentModal(true)}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Create Your First Assignment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="bg-[#1a1f29] border border-gray-700 rounded-lg p-4 hover:border-green-500 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{assignment.title}</h3>
                        <p className="text-gray-400 text-sm mb-3">{assignment.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {assignment.deadline && (
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "Announcement":
        return (
          <div className="p-4">
            {announcements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Megaphone size={48} className="mx-auto mb-4 text-gray-600" />
                <p>No announcements created yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="bg-[#1a1f29] border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300">{announcement.message}</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "Students":
        return (
          <div className="p-4">
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-600" />
                <p>No students enrolled yet</p>
              </div>
            ) : (
              <table className="w-full text-left text-gray-300 text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 uppercase text-xs">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Last Accessed</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-800 hover:bg-[#1c2128] transition">
                      <td className="py-3 px-4">{student.student_name}</td>
                      <td className="py-3 px-4">{student.student_email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-green-500 text-xs">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {student.last_accessed ? new Date(student.last_accessed).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case "Analytics":
        return (
          <div className="p-4 text-center py-8 text-gray-500">
            <BarChart2 size={48} className="mx-auto mb-4 text-gray-600" />
            <p>Analytics dashboard coming soon</p>
          </div>
        );

      default:
        return <div className="p-4 text-gray-400">Content for {activeTab}</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6">
        <div className="text-red-500">
          <h2 className="text-xl font-bold">Course Not Found</h2>
          <p>The course you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Content */}
        <div className="flex-1 space-y-6">
          {/* Course Header */}
          <div className="bg-[#161b22] p-6 rounded-lg border border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold text-green-500">{course.title}</h1>
                <p className="text-gray-400 mt-2">{students.length} Students • {lessons.length} Lessons • {quizzes.length} Quizzes</p>
              </div>
              <img
                src={course.image_url || "/hand.png"}
                alt="Course"
                className="relative w-full aspect-square h-32 object-cover rounded-lg"
              />
            </div>
            
          </div>

          {/* Tabs */}
          <div className="bg-[#161b22] border border-gray-800 rounded-lg">
            <div className="flex justify-around text-gray-400 text-sm font-medium border-b border-gray-700">
              {["Lesson", "Quiz", "Assignments", "Announcement", "Students", "Analytics"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 hover:text-green-500 transition-colors duration-200 ${
                    activeTab === tab ? "text-green-500 border-b-2 border-green-500" : ""
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-96 bg-[#161b22] border border-gray-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Lightbulb size={20} className="text-green-500" />
            <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-400">Course Insights</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <div className="text-green-500 mt-1">☑</div>
                {students.length} students enrolled in this course
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <div className="text-green-500 mt-1">☑</div>
                {lessons.length} lessons created
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <div className="text-green-500 mt-1">☑</div>
                {quizzes.length} quizzes available
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-300">
                <div className="text-green-500 mt-1">☑</div>
                Average progress: {Math.round(students.reduce((acc, student) => acc + student.progress, 0) / (students.length || 1))}%
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-400">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={handleAddLesson}
                className="w-full text-left p-3 bg-[#0d1117] hover:bg-[#1a1f29] rounded-lg transition-colors text-sm"
              >
                + Create New Lesson
              </button>
              <button 
                onClick={handleAddQuiz}
                className="w-full text-left p-3 bg-[#0d1117] hover:bg-[#1a1f29] rounded-lg transition-colors text-sm"
              >
                + Create New Quiz
              </button>
              <button className="w-full text-left p-3 bg-[#0d1117] hover:bg-[#1a1f29] rounded-lg transition-colors text-sm">
                + Send Announcement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Lesson Modal */}
      <AddLessonModal />

      {/* Add Quiz Modal */}
      <AddQuizModal />

      {/* Add Assignment Modal */}
      <AddAssignmentModal />
    </>
  );
};

export default CoursePage;