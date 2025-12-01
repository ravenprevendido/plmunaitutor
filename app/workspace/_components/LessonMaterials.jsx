"use client";
import React, { useState, useEffect } from "react";
import { FileText, Video, BookOpen, ExternalLink, CheckCircle2, Clock, Rocket, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

function LessonMaterials() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLessonMaterials();
    
    // Refresh when window gains focus (user returns to tab)
    const handleFocus = () => {
      fetchLessonMaterials();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Optional: Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLessonMaterials();
    }, 30000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const fetchLessonMaterials = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch('/api/student/lesson-materials', {
        cache: 'no-store' // Ensure fresh data
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllLessons(data || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch lesson materials:', response.status, errorData);
        setAllLessons([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching lesson materials:', error);
      setAllLessons([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchLessonMaterials(true);
  };

  const getIcon = (lessonType) => {
    if (lessonType === "video") {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-sm"></div>
          <Video className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-red-400" />
        </div>
      );
    }
    if (lessonType === "practice") {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 rounded-lg blur-sm"></div>
          <Rocket className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-purple-400" />
        </div>
      );
    }
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-sm"></div>
        <FileText className="relative w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-blue-400" />
      </div>
    );
  };

  const getLessonRoute = (lesson) => {
    if (lesson.lessonType === 'video') {
      return `/workspace/my-courses/${lesson.courseId}/lesson/${lesson.id}`;
    } else if (lesson.lessonType === 'practice') {
      return `/workspace/my-courses/${lesson.courseId}/practice-lesson/${lesson.id}`;
    } else {
      return `/workspace/my-courses/${lesson.courseId}/text-lesson/${lesson.id}`;
    }
  };

  const handleViewClick = (lesson) => {
    const route = getLessonRoute(lesson);
    router.push(route);
  };

  if (loading) {
    return (
      <div className="text-gray-900 dark:text-white w-full">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/90 dark:to-gray-800/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-700/50 w-full">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-gray-900 dark:text-white w-full">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/90 dark:to-gray-800/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-700/50 w-full overflow-hidden">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-lg blur-md"></div>
              <div className="relative p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                All Lesson Materials
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {allLessons.length} {allLessons.length === 1 ? 'lesson' : 'lessons'} available
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh lesson materials"
            >
              <RefreshCw className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden md:grid md:grid-cols-4 font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-300 dark:border-gray-700/50 pb-3 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-5 text-blue-400" /> LESSON
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-5 text-green-400" /> COURSE
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-5 text-yellow-400" /> STATUS
          </div>
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-5 text-purple-400" /> ACTION
          </div>
        </div>

        {/* Lessons List */}
        <div className="space-y-2 sm:space-y-3">
          <AnimatePresence>
            {allLessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="border-b border-gray-200 dark:border-gray-700/50 last:border-b-0"
              >
                {/* Mobile Layout - Card Style */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="md:hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-300 dark:border-gray-700/30 hover:border-gray-400 dark:hover:border-gray-600/50 transition-all duration-300"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {getIcon(lesson.lessonType)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1 wrap-break-word">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        <BookOpen className="w-3 h-3" />
                        <span className="truncate">{lesson.courseTitle}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-300 dark:border-gray-700/50">
                    <div>
                      {lesson.status === "viewed" ? (
                        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-lg shadow-green-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Viewed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-lg shadow-yellow-500/20">
                          <Clock className="w-3 h-3" />
                          Not Viewed
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <motion.button
                        onClick={() => handleViewClick(lesson)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Desktop Layout - Grid Style */}
                <motion.div
                  whileHover={{ x: 4 }}
                  className="hidden md:grid md:grid-cols-4 items-center gap-4 p-4 text-sm text-gray-900 dark:text-white bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-900/30 rounded-lg border border-gray-300 dark:border-gray-700/30 hover:border-gray-400 dark:hover:border-gray-600/50 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-800/50 dark:hover:to-gray-900/50 transition-all duration-300 cursor-pointer"
                >
                  {/* Lesson */}
                  <div className="flex items-center gap-3 min-w-0">
                    {getIcon(lesson.lessonType)}
                    <span className="font-semibold text-gray-900 dark:text-white truncate">{lesson.title}</span>
                  </div>

                  {/* Course */}
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 truncate">
                    <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                    <span className="truncate">{lesson.courseTitle}</span>
                  </div>

                  {/* Status */}
                  <div>
                    {lesson.status === "viewed" ? (
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 px-3 py-1.5 rounded-full text-xs font-medium text-white whitespace-nowrap shadow-lg shadow-green-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Viewed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 px-3 py-1.5 rounded-full text-xs font-medium text-white whitespace-nowrap shadow-lg shadow-yellow-500/20">
                        <Clock className="w-3 h-3" />
                        Not Viewed
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <div>
                    <motion.button
                      onClick={() => handleViewClick(lesson)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {allLessons.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 sm:py-16"
          >
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"></div>
              <div className="relative p-4 bg-gray-100 dark:bg-gray-800/50 rounded-full border border-gray-300 dark:border-gray-700/50">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 dark:text-gray-500" />
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Lesson Materials Available</h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-500 max-w-md mx-auto">
              Lesson materials will appear here once you enroll in courses with published content.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default LessonMaterials;
