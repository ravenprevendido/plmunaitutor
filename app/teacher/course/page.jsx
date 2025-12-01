"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const Page = () => {
  const [courses, setCourses] = useState([]);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      fetchTeacherCourses();
      fetchTeacherRequests();
    }
    
    const handleCourseUpdate = () => {
      setRefreshing(true);
      setTimeout(() => {
        fetchTeacherCourses();
        fetchTeacherRequests();
      }, 500);
    };

    window.addEventListener('courseUpdated', handleCourseUpdate);
    window.addEventListener('teacherRequestUpdated', handleCourseUpdate);
    
    return () => {
      window.removeEventListener('courseUpdated', handleCourseUpdate);
      window.removeEventListener('teacherRequestUpdated', handleCourseUpdate);
    };
  }, [isLoaded]);

  const fetchTeacherCourses = async () => {
    try {
      console.log("👨‍🏫 Fetching available courses for teacher...");
      const response = await fetch('/api/courses/teacher');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        console.log(`✅ Loaded ${data.length} courses`);
      } else {
        console.error('Failed to fetch teacher courses');
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTeacherRequests = async () => {
    try {
      const response = await fetch('/api/admin-teacher-requests');
      if (response.ok) {
        const data = await response.json();
        setTeacherRequests(data);
      }
    } catch (error) {
      console.error('Error fetching teacher requests:', error);
      setTeacherRequests([]);
    }
  };

  const handleRequestCourse = async (courseId, courseTitle, courseCategory) => {
    if (!user) {
      alert("Please log in to request course management.");
      return;
    }

    try {
      console.log("📝 Requesting to manage course:", courseTitle);
      
      const teacherName = user.fullName || 
                         `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                         user.username || 
                         'Unknown Teacher';
      
      const requestData = {
        course_id: courseId,
        teacher_name: teacherName,
        teacher_email: user.primaryEmailAddress?.emailAddress,
        course_title: courseTitle,
        course_category: courseCategory
      };

      const response = await fetch('/api/admin-teacher-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const newRequest = await response.json();
        alert('✅ Course management request sent to admin!');
        fetchTeacherCourses();
        fetchTeacherRequests();
      } else {
        const errorData = await response.json();
        alert(errorData.error || '❌ Failed to send request.');
      }
    } catch (error) {
      console.error('Error requesting course:', error);
      alert('❌ Error sending request.');
    }
  };

  const slugify = (title) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  // Simple assignment status check
  const getCourseStatus = (course) => {
    const isAssignedToMe = course.assigned_teacher_id === user?.primaryEmailAddress?.emailAddress;
    
    if (isAssignedToMe) {
      return 'assigned-to-me';
    } else if (course.assigned_teacher_id) {
      return 'assigned-to-other';
    } else {
      return 'available';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-500">Available Courses</h1>
          <p className="text-gray-400">Loading courses...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-[#161b22] rounded-xl border border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-10 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 sm:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-500">Available Courses</h1>
        </div>
        <button
          onClick={() => {
            fetchTeacherCourses();
            fetchTeacherRequests();
          }}
          disabled={refreshing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24">
            <path 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
        {courses.map((course) => {
          const slug = course.slug || slugify(course.title);
          const courseStatus = getCourseStatus(course);
          
          return (
            <div key={course.id} className="bg-[#161b22] rounded-xl border border-gray-700 p-5 sm:p-6 hover:border-green-500 transition-all duration-300">
              {/* Course Title */}
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
                {course.title}
              </h3>

              {/* Course Description */}
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {course.description || "No description available"}
              </p>

              {/* Course Category */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">
                  {course.category || "Uncategorized"}
                </span>
              </div>

              {/* Assignment Status - SIMPLE VERSION */}
              {courseStatus === 'assigned-to-other' && (
                <p className="text-red-400 text-sm mb-3">
                  Currently managed by another teacher
                </p>
              )}

              {/* Created Date */}
              <div className="mb-4">
                <p className="text-gray-500 text-xs">
                  Created: {new Date(course.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Action Button - SIMPLE VERSION */}
              <div className="space-y-2">
                {courseStatus === 'available' ? (
                  <button
                    onClick={() => handleRequestCourse(course.id, course.title, course.category)}
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-md py-2 px-4 font-medium transition-colors duration-200 text-sm cursor-pointer"
                  >
                    Request to Manage
                  </button>
                ) : courseStatus === 'assigned-to-me' ? (
                  <Link href={`/teacher/course/${slug}`}>
                    <button className="w-full bg-green-600 hover:bg-green-700 rounded-md py-2 px-4 font-medium transition-colors duration-200 text-sm cursor-pointer">
                      Manage Course
                    </button>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-600 cursor-not-allowed rounded-md py-2 px-4 font-medium text-sm opacity-50"
                  >
                    Already Assigned
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No Courses Available</div>
          <p className="text-gray-500 text-sm mb-4">
            There are currently no courses in the system.
          </p>
          <button
            onClick={() => {
              fetchTeacherCourses();
              fetchTeacherRequests();
            }}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
          >
            Check for New Courses
          </button>
        </div>
      )}
    </div>
  );
};

export default Page;