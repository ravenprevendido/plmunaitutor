"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Tabs from "./components/Tabs";
import LessonTab from "./components/LessonTab";
import CourseProgressBar from "./components/CourseProgressBar";
import AiTutorCard from "./components/AiTutorCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import QuizzesTab from "./components/QuizzesTab";
import AssignmentTab from "./components/AssignmentTab";
import AnnouncementTab from "./components/AnnouncementsTab";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "lessons";
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [studentProgress, setStudentProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📚 Fetching course data for course ID:", courseId);
      
      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course: ${courseResponse.status}`);
      }
      const courseData = await courseResponse.json();
      setCourse(courseData);
      
      console.log("✅ Course data:", courseData);
      
      // Fetch course content
      const [lessonsRes, quizzesRes, assignmentsRes, announcementsRes, progressRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/lessons`),
        fetch(`/api/courses/${courseId}/quizzes`),
        fetch(`/api/courses/${courseId}/assignments`),
        fetch(`/api/courses/${courseId}/announcements`),
        fetch(`/api/courses/${courseId}/progress`)
      ]);

      // Log responses for debugging
      console.log("📖 Lessons response:", lessonsRes);
      console.log("❓ Quizzes response:", quizzesRes);
      console.log("📝 Assignments response:", assignmentsRes);

      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        console.log("✅ Lessons data:", lessonsData);
        // Filter only published lessons for students
        const publishedLessons = lessonsData.filter(lesson => 
          lesson.status === 'published' || !lesson.status // Include lessons without status for backward compatibility
        );
        setLessons(publishedLessons);
      } else {
        console.error("❌ Failed to fetch lessons:", lessonsRes.status);
      }

      if (quizzesRes.ok) setQuizzes(await quizzesRes.json());
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
      
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setStudentProgress(progressData);
      }

    } catch (error) {
      console.error('❌ Error fetching course data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = async (lessonId) => {
    try {
      console.log("🎯 Student clicked on lesson:", lessonId);
      
      const response = await fetch('/api/student-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: parseInt(courseId),
          lesson_id: lessonId,
          completed: true
        })
      });

      if (response.ok) {
        console.log("✅ Progress updated for lesson:", lessonId);
        // Refresh progress data
        const progressRes = await fetch(`/api/courses/${courseId}/progress`);
        if (progressRes.ok) {
          setStudentProgress(await progressRes.json());
        }
      } else {
        console.error("❌ Failed to update progress");
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-gray-900 dark:text-white bg-white dark:bg-[#0D1117] min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 dark:text-red-500 bg-white dark:bg-[#0D1117] min-h-screen">
        <h2 className="text-xl font-bold mb-2">Error Loading Course</h2>
        <p>{error}</p>
        <button 
          onClick={fetchCourseData}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 text-red-600 dark:text-red-500 bg-white dark:bg-[#0D1117] min-h-screen">
        Course not found. Please check if the course exists and you are enrolled.
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-900 dark:text-white bg-white dark:bg-[#0D1117] min-h-screen">
      {/* Header */}
      <div className="bg-green-600 text-white p-8 w-80 md:w-full md:ml-0 -ml-11 rounded-lg mb-6">
        <Link href={`/workspace/my-courses/`}>
          <ArrowLeft className="w-4 h-4 text-white" />
        </Link>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-sm">By {course.teacher_name}</p>
        <p className="text-xs mt-2">
          {lessons.length} Lessons • {quizzes.length} Quizzes • {assignments.length} Assignments
        </p>
      </div>
      
      {/* Debug info - remove in production */}
   
      
      {/* Main layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3">
          {/* Tabs only visible on large screens */}
          <div className="hidden lg:block">
            <Tabs courseId={courseId} activeTab={activeTab} />
          </div>
          <div className="w-80 md:w-full md:ml-0 -ml-11">
            {activeTab === "lessons" && (
              <LessonTab 
                lessons={lessons} 
                courseId={courseId} 
                onLessonClick={handleLessonClick}
                studentProgress={studentProgress}
              />
            )}
            {activeTab === "quizzes" && <QuizzesTab quizzes={quizzes} courseId={courseId} />}
            {activeTab === "assignments" && (
              <AssignmentTab assignments={assignments} courseId={courseId} />
            )}
            {activeTab === "announcement" && (
              <AnnouncementTab announcements={announcements} courseId={courseId} />
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-2 w-80 md:w-80 -ml-11 md:ml-0">
          <CourseProgressBar 
            courseId={courseId} 
            lessonsCount={lessons.length}
            quizzesCount={quizzes.length}
            assignmentsCount={assignments.length}
            studentProgress={studentProgress}
          />
          <AiTutorCard />
        </div>
      </div>

      {/* Mobile Footer Tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-around py-3">
          <Tabs courseId={courseId} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}