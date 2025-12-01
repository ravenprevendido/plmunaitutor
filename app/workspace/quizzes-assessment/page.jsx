'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Filter, CheckCircle, Clock, AlertCircle, Eye, Play } from 'lucide-react';

const QuizzessAssessment = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch actual quiz data from your API
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/student/quizzes');
        if (response.ok) {
          const data = await response.json();
          console.log('📚 Fetched quizzes:', data);
          setQuizzes(data);
          setFilteredQuizzes(data);
        } else {
          const errorData = await response.json();
          console.error('Error fetching quizzes:', errorData);
          // Fallback to empty array if API fails
          setQuizzes([]);
          setFilteredQuizzes([]);
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setQuizzes([]);
        setFilteredQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [pathname]); // Refresh when pathname changes (e.g., navigating back to this page)

  // Filter quizzes based on search and filters
  useEffect(() => {
    let filtered = quizzes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.course.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quiz => quiz.status === statusFilter);
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(quiz => quiz.course === courseFilter);
    }

    setFilteredQuizzes(filtered);
  }, [searchTerm, statusFilter, courseFilter, quizzes]);

  // Get unique courses for filter dropdown
  const uniqueCourses = [...new Set(quizzes.map(quiz => quiz.course))];

  const handleViewScore = (quiz) => {
    // Navigate to quiz results page
    router.push(`/workspace/quiz-results/${quiz.id}`);
  };

  const handleStartQuiz = (quiz) => {
    // Navigate to quiz taking page
    router.push(`/workspace/my-courses/${quiz.courseId}/quiz/${quiz.id}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'Pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'Overdue':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500 text-white';
      case 'Pending':
        return 'bg-yellow-500 text-white';
      case 'Overdue':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getButtonConfig = (quiz) => {
    if (quiz.status === 'Completed') {
      return {
        text: 'View Score',
        icon: <Eye size={16} />,
        onClick: () => handleViewScore(quiz),
        className: 'bg-green-600 hover:bg-green-700'
      };
    } else {
      return {
        text: 'Start Quiz',
        icon: <Play size={16} />,
        onClick: () => handleStartQuiz(quiz),
        className: 'bg-blue-600 hover:bg-blue-700'
      };
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-white dark:bg-[#161B22] text-gray-900 dark:text-white md:w-full md:-ml-0 w-82 -ml-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-gray-50 dark:bg-[#181e27] rounded-lg p-5 shadow-md border border-gray-200 dark:border-slate-700">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-[#161B22] text-gray-900 dark:text-white md:w-full md:-ml-0 w-82 -ml-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold mb-2 lg:text-3xl text-gray-900 dark:text-white">All Quizzes & Assessments</h1>
        <p className="text-gray-600 dark:text-slate-400">Track your progress and manage your quizzes</p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 dark:bg-[#181e27] rounded-lg p-4 border border-gray-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Courses</option>
              {uniqueCourses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-gray-600 dark:text-slate-400">
              {filteredQuizzes.length} {filteredQuizzes.length === 1 ? 'quiz' : 'quizzes'} found
            </span>
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-600 dark:text-slate-400 text-lg mb-2">No quizzes found</div>
          <p className="text-gray-500 dark:text-slate-500 text-sm">
            {searchTerm || statusFilter !== 'all' || courseFilter !== 'all' 
              ? 'Try adjusting your filters or search terms'
              : 'No quizzes available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredQuizzes.map((quiz, index) => {
            const buttonConfig = getButtonConfig(quiz);
            
            return (
              <div key={index} className="bg-gray-50 dark:bg-[#181e27] rounded-lg p-5 shadow-md border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 transition-colors duration-200 flex flex-col">
                {/* Quiz Title */}
                <h2 className="text-lg font-semibold mb-1 line-clamp-2 text-gray-900 dark:text-white">{quiz.title}</h2>
                
                {/* Course */}
                <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">Course: {quiz.course}</p>
                
                {/* Due Date */}
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">Due: {quiz.due}</p>
                
                {/* Status and Score */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(quiz.status)}
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(quiz.status)}`}>
                      {quiz.status}
                    </span>
                  </div>
                  
                  {quiz.score && (
                    <span className="text-green-400 font-semibold text-sm">
                      Score: {quiz.score}
                    </span>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={buttonConfig.onClick}
                  className={`mt-auto w-full py-2 rounded text-white font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${buttonConfig.className}`}
                >
                  {buttonConfig.icon}
                  {buttonConfig.text}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Static data fallback
const staticQuizzes = [
  {
    id: 1,
    title: 'Quiz 1: Python Basics',
    course: 'Intro to Python',
    courseId: 1,
    due: 'Oct 26, 2025',
    status: 'Completed',
    score: '95%',
  },
  {
    id: 2,
    title: 'Quiz 2: Python Functions',
    course: 'Intro to Python',
    courseId: 1,
    due: 'Nov 5, 2025',
    status: 'Pending',
    score: null,
  },
  {
    id: 3,
    title: 'Midterm: Web Dev',
    course: 'Web Development',
    courseId: 2,
    due: 'Nov 10, 2025',
    status: 'Pending',
    score: null,
  },
  {
    id: 4,
    title: 'Final: Data Structures',
    course: 'Computer Science',
    courseId: 3,
    due: 'Nov 15, 2025',
    status: 'Overdue',
    score: null,
  },
  {
    id: 5,
    title: 'Quiz 3: Algorithms',
    course: 'Computer Science',
    courseId: 3,
    due: 'Nov 20, 2025',
    status: 'Completed',
    score: '88%',
  },
  {
    id: 6,
    title: 'Assignment: CSS Grid',
    course: 'Web Development',
    courseId: 2,
    due: 'Nov 8, 2025',
    status: 'Pending',
    score: null,
  },
];

export default QuizzessAssessment;