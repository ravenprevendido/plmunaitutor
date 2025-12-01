"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { BookOpen, User, Clock, CheckCircle, Play, RefreshCw  } from 'lucide-react';
import Link from 'next/link';

function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      fetchStudentCourses();
    }
  }, [isLoaded]);

  const fetchStudentCourses = async () => {
    try {
      setRefreshing(true);
      console.log("🎓 Fetching student courses...");
      const response = await fetch('/api/courses/student');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        console.log(`✅ Loaded ${data.length} courses`);
      } else {
        console.error('Failed to fetch student courses');
      }
    } catch (error) {
      console.error('Error fetching student courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEnroll = async (courseId, courseTitle) => {
    if (!user) {
      alert("Please log in to enroll in courses.");
      return;
    }

    try {
      console.log("📝 Enrolling in course:", courseTitle);
      
      const enrollmentData = {
        course_id: courseId,
        student_name: user.fullName || `${user.firstName} ${user.lastName}`,
        student_email: user.primaryEmailAddress?.emailAddress
      };

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollmentData)
      });

      if (response.ok) {
        const newEnrollment = await response.json();
        alert('✅ Enrollment request sent! Waiting for admin approval.');


        

        fetchStudentCourses();
      } else {
        const errorData = await response.json();
        alert(errorData.error || '❌ Failed to enroll. Please try again.');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('❌ Error enrolling. Please try again.');
    }
    
  };

  const updateLastAccessed = async (enrollmentId, courseId) => {
    try {
      await fetch('/api/enrollments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          courseId,
          last_accessed: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error updating last accessed:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { 
          text: 'Enrolled', 
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: '✅'
        };
      case 'pending':
        return { 
          text: 'Pending Approval', 
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: '⏳'
        };
      case 'rejected':
        return { 
          text: 'Rejected', 
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: '❌'
        };
      default:
        return { 
          text: 'Not Enrolled', 
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: '📚'
        };
    }
  };

  if (loading) {
    return (
      <div className="mt-4 sm:mt-6 px-2 sm:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-gray-50 dark:bg-[#13181F] rounded-lg shadow-md p-4 sm:p-5 md:p-6 animate-pulse">
              <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 sm:mb-4"></div>
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3 sm:mb-4"></div>
              <div className="h-10 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='mt-2 sm:mt-6 px-0 sm:px-6 md:px-0'>
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6 px-2 sm:px-0'>
        <h2 className='font-bold text-xl sm:text-2xl md:text-3xl text-gray-900 dark:text-gray-300'>Available Courses</h2>
        
      </div>
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6'>
        {courses.map((course) => {
          const statusBadge = getStatusBadge(course.enrollment_status);
          const isEnrolled = course.enrollment_status === 'approved';
          const isPending = course.enrollment_status === 'pending';
          const isRejected = course.enrollment_status === 'rejected';
          
          return (
            <div key={course.id} className='bg-white dark:bg-[#13181F] rounded-xl shadow-lg w-full p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-800 hover:border-green-500 transition-all duration-300'>
              {/* Course Header */}
              <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2 sm:gap-3'>
                <div className="flex-1 min-w-0">
                  <h3 className='text-xl sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-300 mb-2 line-clamp-2 break-words'>
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm sm:text-sm text-gray-600 dark:text-gray-400">
                    <User size={16} className="w-4 h-4 shrink-0" />
                    <span className="break-words">By {course.teacher_name || 'No teacher assigned'}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-xs border ${statusBadge.color} flex items-center gap-1.5 shrink-0 self-start sm:self-auto`}>
                  <span className="text-sm">{statusBadge.icon}</span>
                  <span className="whitespace-nowrap font-medium">{statusBadge.text}</span>
                </span>
              </div>

              {/* Course Description */}
              <p className='text-gray-600 dark:text-gray-400 text-sm sm:text-sm mb-4 line-clamp-3 leading-relaxed'>
                {course.description || "No description available"}
              </p>
              {/* Progress Bar (only for enrolled students) */}
              {isEnrolled && (
                <div className='mb-4'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='text-sm sm:text-sm text-gray-700 dark:text-gray-300 font-semibold'>Your Progress</span>
                    <span className='text-sm sm:text-sm text-green-600 dark:text-green-400 font-bold'>{course.progress}%</span>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-2.5'>
                    <div 
                      className='bg-green-600 h-2.5 sm:h-2.5 rounded-full transition-all duration-500'
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Last Access & Course Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-600 dark:text-gray-500 mb-4">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock size={12} className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="break-words">Last access: {formatDate(course.last_accessed)}</span>
                </div>
                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-400 text-xs flex-shrink-0 self-start sm:self-auto font-medium">
                  {course.category || 'Uncategorized'}
                </span>
              </div>

              {/* Action Button */}
              <div className="mt-3 sm:mt-4">
                {isEnrolled ? (
                  <Link 
                    href={`/workspace/my-courses/${course.id}`}
                    onClick={() => updateLastAccessed(course.enrollment_id, course.id)}
                    className="block w-full"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-500 transition-colors text-sm sm:text-base py-3 sm:py-3 h-auto font-semibold">
                      <Play className='w-4 h-4 sm:w-5 sm:h-5 mr-2'/>
                      <span>Continue Learning</span>
                    </Button>
                  </Link>
                ) : isPending ? (
                  <Button disabled className="w-full bg-yellow-600 hover:bg-yellow-600 cursor-not-allowed opacity-75 text-sm sm:text-base py-3 sm:py-3 h-auto font-semibold">
                    <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5 mr-2'/>
                    <span>Pending Approval</span>
                  </Button>
                ) : isRejected ? (
                  <Button 
                    onClick={() => handleEnroll(course.id, course.title)}
                    className="w-full bg-red-600 hover:bg-red-500 transition-colors text-sm sm:text-base py-3 sm:py-3 h-auto font-semibold"
                  >
                    <span>Try Again</span>
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleEnroll(course.id, course.title)}
                    className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-sm sm:text-base py-3 sm:py-3 h-auto font-semibold"
                  >
                    <span>Enroll Now</span>
                  </Button>
                )}
              </div>

              {/* Additional Info */}
              {isPending && (
                <p className="text-sm text-yellow-400 text-center mt-3 sm:mt-3">
                  Waiting for admin approval
                </p>
              )}
              {isRejected && (
                <p className="text-sm text-red-400 text-center mt-3 sm:mt-3">
                  Your enrollment was rejected
                </p>
              )}
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="text-gray-600 dark:text-gray-400 text-base sm:text-lg mb-2">No Courses Available</div>
          <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm">
            There are currently no courses available for enrollment.
          </p>
        </div>
      )}
    </div>
  );
}

export default CourseList;