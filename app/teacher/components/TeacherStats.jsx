// teacher/components/TeacherStats.jsx
"use client";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, RefreshCw, AlertCircle, User } from "lucide-react";
import TeacherWelcome from "./TeacherWelcome";

export default function AnalyticsPage() {
  const [openSection, setOpenSection] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState([]);
  const [courses, setCourses] = useState(["All Courses"]);
  const [error, setError] = useState(null);
  const [studentQuestions, setStudentQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await fetch('/api/teacher/dashboard-stats');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch course performance data
  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/teacher/course-performance');
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data.performanceData || []);
        setCourses(["All Courses", ...data.courses]);
      } else {
        throw new Error('Failed to fetch performance data');
      }
    } catch (err) {
      console.error('Error fetching performance data:', err);
      // Use fallback data
      setPerformanceData([
        { name: "Python Basics", value: 75 },
        { name: "Web Development", value: 82 },
        { name: "Java OOP", value: 68 },
        { name: "Data Structures", value: 90 },
      ]);
      setCourses(["All Courses", "Python Basics", "Web Development", "Java OOP", "Data Structures"]);
    }
  };

  // Fetch student questions
  const fetchStudentQuestions = async () => {
    try {
      setQuestionsLoading(true);
      const response = await fetch('/api/teacher/student-questions');
      if (response.ok) {
        const data = await response.json();
        setStudentQuestions(data.questions || []);
      } else {
        throw new Error('Failed to fetch student questions');
      }
    } catch (err) {
      console.error('Error fetching student questions:', err);
      setStudentQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchPerformanceData();
    fetchStudentQuestions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchStudentQuestions();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Filter logic for chart
  const filteredData =
    selectedCourse === "All Courses"
      ? performanceData
      : performanceData.filter((d) => d.name === selectedCourse);

  // Stats cards configuration
  const statCards = [
    { 
      key: 'totalCourses', 
      title: "Total Courses", 
      icon: "📘",
      getValue: (stats) => stats?.totalCourses?.count || "0",
      getDesc: (stats) => stats?.totalCourses?.trend || "Loading...",
    },
    { 
      key: 'enrolledStudents', 
      title: "Enrolled Students", 
      icon: "🎓",
      getValue: (stats) => stats?.enrolledStudents?.count || "0",
      getDesc: (stats) => stats?.enrolledStudents?.trend || "Loading...",
    },
    { 
      key: 'pendingAssignments', 
      title: "Pending Assignments", 
      icon: "🗓️",
      getValue: (stats) => stats?.pendingAssignments?.count || "0",
      getDesc: (stats) => stats?.pendingAssignments?.trend || "Loading...",
    },
    { 
      key: 'averageQuizScore', 
      title: "Average Quiz Score", 
      icon: "🎯",
      getValue: (stats) => stats?.averageQuizScore?.count ? `${stats.averageQuizScore.count}%` : "0%",
      getDesc: (stats) => stats?.averageQuizScore?.trend || "Loading...",
    },
  ];

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-200 p-6">
        <TeacherWelcome />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#161b22] p-5 rounded-2xl shadow animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-6 w-6 bg-gray-700 rounded"></div>
              </div>
              <div className="h-8 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-6">
      <TeacherWelcome/>
      
      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <div>
            <p className="text-red-400 font-medium">Error loading data</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
          <button
            onClick={() => {
              fetchDashboardStats();
              fetchPerformanceData();
              fetchStudentQuestions();
            }}
            className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
      
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-[#161b22] p-5 rounded-2xl shadow hover:shadow-lg hover:shadow-green-500/10 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400">{card.title}</p>
              <span className="text-xl">{card.icon}</span>
            </div>
            <h2 className="text-3xl font-bold text-green-400">
              {card.getValue(stats)}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {card.getDesc(stats)}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <div className="bg-[#161b22] p-6 rounded-2xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              Student Performance Per Course
            </h2>

            {/* Select Dropdown Filter */}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] text-sm text-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
              <XAxis dataKey="name" stroke="#8b949e" />
              <YAxis stroke="#8b949e" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  color: "#fff",
                }}
                formatter={(value) => [`${value}%`, 'Average Score']}
              />
              <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights Section - ORIGINAL DESIGN */}
        <div className="bg-[#161b22] p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-white">
            AI Insights Powered by Gemini
          </h2>

          {/* Accordion Section */}
          <div className="space-y-3">
            {/* Common Student Questions Accordion */}
            <div className="border border-[#30363d] rounded-lg">
              <button
                className="flex justify-between items-center w-full px-4 py-3 text-left hover:bg-[#21262d] transition"
                onClick={() => toggleSection('commonQuestions')}
              >
                <span className="font-medium text-gray-300">Common Student Questions</span>
                <ChevronDown
                  className={`w-4 h-4 transform transition-transform ${
                    openSection === 'commonQuestions'
                      ? "rotate-180 text-green-400"
                      : "text-gray-500"
                  }`}
                />
              </button>
                  {openSection === 'commonQuestions' && (
                    <div className="px-6 pb-3 text-sm text-gray-400 space-y-3">
                      {questionsLoading ? (
                        [1, 2, 3].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                          </div>
                        ))
                      ) : studentQuestions.length > 0 ? (
                        studentQuestions.slice(0, 6).map((question) => (
                          <div key={question.id} className="border border-[#30363d] rounded-lg p-3 bg-[#11161f]">
                            <div className="flex items-center gap-3 mb-2">
                              {question.student_avatar ? (
                                <img
                                  src={question.student_avatar}
                                  alt={question.student_name}
                                  className="w-8 h-8 rounded-full border border-green-500 object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-medium text-white text-sm">
                                  {question.student_name}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{formatDate(question.asked_at)}</span>
                                  {question.subject && question.subject !== 'General' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                                      {question.subject}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-gray-200 text-sm">
                                <span className="font-semibold text-green-400">Student:</span> {question.question}
                              </p>
                              {question.ai_response && (
                                <div className="bg-[#1c222c] border border-[#30363d] rounded-lg p-3 text-xs text-gray-300">
                                  <p className="font-semibold text-green-300 mb-1">AI Response</p>
                                  <p>{question.ai_response}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        [
                          "What is the difference between supervised and unsupervised learning?",
                          "How do I interpret feature importance in a model?",
                          "Can AI be truly creative, or is it just mimicking?",
                        ].map((question, i) => (
                          <p key={i}>• {question}</p>
                        ))
                      )}
                    </div>
                  )}
            </div>

            {/* AI-Suggested Lesson Improvements Accordion */}
            <div className="border border-[#30363d] rounded-lg">
              <button
                className="flex justify-between items-center w-full px-4 py-3 text-left hover:bg-[#21262d] transition"
                onClick={() => toggleSection('lessonImprovements')}
              >
                <span className="font-medium text-gray-300">AI-Suggested Lesson Improvements</span>
                <ChevronDown
                  className={`w-4 h-4 transform transition-transform ${
                    openSection === 'lessonImprovements'
                      ? "rotate-180 text-green-400"
                      : "text-gray-500"
                  }`}
                />
              </button>
              {openSection === 'lessonImprovements' && (
                <div className="px-6 pb-3 text-sm text-gray-400 space-y-2">
                  {[
                    "Increase interactive exercises for NLP.",
                    "Add visual examples for Deep Learning topics.",
                    "Simplify explanations in Reinforcement Learning module.",
                  ].map((improvement, i) => (
                    <p key={i}>• {improvement}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Engagement Feedback Accordion */}
            <div className="border border-[#30363d] rounded-lg">
              <button
                className="flex justify-between items-center w-full px-4 py-3 text-left hover:bg-[#21262d] transition"
                onClick={() => toggleSection('engagementFeedback')}
              >
                <span className="font-medium text-gray-300">Engagement Feedback</span>
                <ChevronDown
                  className={`w-4 h-4 transform transition-transform ${
                    openSection === 'engagementFeedback'
                      ? "rotate-180 text-green-400"
                      : "text-gray-500"
                  }`}
                />
              </button>
              {openSection === 'engagementFeedback' && (
                <div className="px-6 pb-3 text-sm text-gray-400 space-y-2">
                  {[
                    "Students engage more with practical case studies.",
                    "Weekly recaps improve retention rates by 15%.",
                  ].map((feedback, i) => (
                    <p key={i}>• {feedback}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}