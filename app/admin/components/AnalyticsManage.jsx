"use client";
import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
Chart.register(
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsManage = () => {
  const courseChartRef = useRef(null);
  const progressChartRef = useRef(null);
  const teacherChartRef = useRef(null);
  const systemChartRef = useRef(null);
  
  const chartInstances = useRef([]);
  const [teacherActivityData, setTeacherActivityData] = useState(null);
  const [weeklyUsageData, setWeeklyUsageData] = useState(null);
  const [coursePopularityData, setCoursePopularityData] = useState(null);
  const [studentProgressData, setStudentProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all analytics data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch teacher activity data
        const teacherResponse = await fetch('/api/admin/teacher-activity');
        if (teacherResponse.ok) {
          const teacherData = await teacherResponse.json();
          setTeacherActivityData(teacherData);
        }

        // Fetch weekly usage data
        const usageResponse = await fetch('/api/admin/weekly-usage');
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setWeeklyUsageData(usageData);
        }

        // Fetch course popularity data
        const popularityResponse = await fetch('/api/admin/course-popularity');
        if (popularityResponse.ok) {
          const popularityData = await popularityResponse.json();
          setCoursePopularityData(popularityData);
        }

        // Fetch average student progress data
        const progressResponse = await fetch('/api/admin/average-student-progress');
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setStudentProgressData(progressData);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    // Destroy existing charts before creating new ones
    chartInstances.current.forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    chartInstances.current = [];

    // Don't create charts until data is loaded
    if (loading) return;

    // Course Popularity Chart - Real-time data
    if (courseChartRef.current && coursePopularityData) {
      const courseCtx = courseChartRef.current.getContext('2d');
      
      // Prepare data from API
      const labels = coursePopularityData.map(course => course.title);
      const enrollments = coursePopularityData.map(course => course.enrollments);

      const courseChart = new Chart(courseCtx, {
        type: "bar",
        data: {
          labels: labels.length > 0 ? labels : ["No courses yet"],
          datasets: [
            {
              label: "Students Enrolled",
              data: enrollments.length > 0 ? enrollments : [0],
              backgroundColor: "#22c55e",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Course Popularity",
              color: "#e2e8f0",
              font: {
                size: 16
              }
            },
            legend: { display: false },
          },
          scales: {
            x: { 
              ticks: { 
                color: "#e2e8f0" 
              },
              grid: {
                color: 'rgba(255,255,255,0.1)'
              }
            },
            y: { 
              ticks: { 
                color: "#e2e8f0",
                beginAtZero: true
              },
              grid: {
                color: 'rgba(255,255,255,0.1)'
              }
            },
          },
        },
      });
      chartInstances.current.push(courseChart);
    }

    // Average Student Progress Chart - Real-time data
    if (progressChartRef.current && studentProgressData) {
      const progressCtx = progressChartRef.current.getContext('2d');
      
      // Prepare data from API
      const overall = studentProgressData.overall || {};
      const completed = overall.completed || 0;
      const inProgress = overall.in_progress || 0;
      const notStarted = overall.not_started || 0;

      const progressChart = new Chart(progressCtx, {
        type: "doughnut",
        data: {
          labels: ["Completed", "In Progress", "Not Started"],
          datasets: [
            {
              data: [completed, inProgress, notStarted],
              backgroundColor: ["#22c55e", "#84cc16", "#facc15"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Average Student Progress",
              color: "#e2e8f0",
              font: {
                size: 16
              }
            },
            legend: {
              labels: {
                color: "#e2e8f0",
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = overall.total_students || 0;
                  return `${label}: ${value}% (${Math.round((value / 100) * total)} students)`;
                }
              }
            }
          },
          cutout: '60%',
        },
      });
      chartInstances.current.push(progressChart);
    }

    // Teacher Activity Stats Chart
    if (teacherChartRef.current && teacherActivityData) {
      const teacherCtx = teacherChartRef.current.getContext('2d');
      
      // Prepare data from API
      const teachers = teacherActivityData.teachers || [];
      const labels = teachers.map(t => t.name);
      const lessonsData = teachers.map(t => t.lessonsCount);
      const quizzesData = teachers.map(t => t.quizzesCount);
      
      // Highlight top performers with different colors
      const lessonsColors = teachers.map(t => 
        t.name === teacherActivityData.topLessonsTeacher 
          ? "#22c55e" // Brighter green for top lessons teacher
          : "#10b981" // Regular green
      );
      
      const quizzesColors = teachers.map(t => 
        t.name === teacherActivityData.topQuizzesTeacher 
          ? "#60a5fa" // Brighter blue for top quizzes teacher
          : "#3b82f6" // Regular blue
      );

      const teacherChart = new Chart(teacherCtx, {
        type: "bar",
        data: {
          labels: labels.length > 0 ? labels : ["No teachers yet"],
          datasets: [
            {
              label: "Lessons Uploaded",
              data: lessonsData.length > 0 ? lessonsData : [0],
              backgroundColor: lessonsColors.length > 0 ? lessonsColors : "#10b981",
              borderColor: teachers.map(t => 
                t.name === teacherActivityData.topLessonsTeacher ? "#16a34a" : "#10b981"
              ),
              borderWidth: teachers.map(t => 
                t.name === teacherActivityData.topLessonsTeacher ? 2 : 1
              ),
            },
            {
              label: "Quizzes Created",
              data: quizzesData.length > 0 ? quizzesData : [0],
              backgroundColor: quizzesColors.length > 0 ? quizzesColors : "#3b82f6",
              borderColor: teachers.map(t => 
                t.name === teacherActivityData.topQuizzesTeacher ? "#2563eb" : "#3b82f6"
              ),
              borderWidth: teachers.map(t => 
                t.name === teacherActivityData.topQuizzesTeacher ? 2 : 1
              ),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Teacher Activity Stats",
              color: "#e2e8f0",
              font: {
                size: 16
              }
            },
            legend: { 
              labels: { 
                color: "#e2e8f0",
                font: {
                  size: 12
                }
              } 
            },
            tooltip: {
              callbacks: {
                afterLabel: (context) => {
                  const teacher = teachers[context.dataIndex];
                  if (!teacher) return '';
                  const isTopLessons = teacher.name === teacherActivityData.topLessonsTeacher && context.datasetIndex === 0;
                  const isTopQuizzes = teacher.name === teacherActivityData.topQuizzesTeacher && context.datasetIndex === 1;
                  if (isTopLessons) return '🏆 Top Lessons Teacher';
                  if (isTopQuizzes) return '🏆 Top Quizzes Teacher';
                  return '';
                }
              }
            }
          },
          scales: {
            x: { 
              ticks: { 
                color: "#e2e8f0" 
              },
              grid: {
                color: 'rgba(255,255,255,0.1)'
              }
            },
            y: { 
              ticks: { 
                color: "#e2e8f0",
                beginAtZero: true
              },
              grid: {
                color: 'rgba(255,255,255,0.1)'
              }
            },
          },
        },
      });
      chartInstances.current.push(teacherChart);
    }

    // System Usage Trends Chart
    if (systemChartRef.current && weeklyUsageData) {
      const systemCtx = systemChartRef.current.getContext('2d');
      
      // Prepare data from API
      const weeklyData = weeklyUsageData.weeklyData || [];
      const labels = weeklyData.map(d => d.day);
      const activeUsersData = weeklyData.map(d => d.activeUsers);

      const systemChart = new Chart(systemCtx, {
        type: "line",
        data: {
          labels: labels.length > 0 ? labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [
            {
              label: "Active Users",
              data: activeUsersData.length > 0 ? activeUsersData : [0, 0, 0, 0, 0, 0, 0],
              borderColor: "#22c55e",
              backgroundColor: "rgba(34,197,94,0.3)",
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointBackgroundColor: "#22c55e",
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              pointRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Weekly System Usage Trends",
              color: "#e2e8f0",
              font: {
                size: 16
              }
            },
            legend: { 
              labels: { 
                color: "#e2e8f0",
                font: {
                  size: 12
                }
              } 
            },
            tooltip: {
              callbacks: {
                afterLabel: (context) => {
                  const dayData = weeklyData[context.dataIndex];
                  if (!dayData) return '';
                  return `Students: ${dayData.students} • Teachers: ${dayData.teachers}`;
                }
              }
            }
          },
          scales: {
            x: { 
              ticks: { 
                color: "#e2e8f0" 
              },
              grid: {
                color: 'rgba(255,255,255,0.1)'
              }
            },
            y: { 
              ticks: { 
                color: "#e2e8f0",
                beginAtZero: true
              },
              grid: {
                color: 'rgba(255,255,255,0.1)'
              }
            },
          },
        },
      });
      chartInstances.current.push(systemChart);
    }

    // Cleanup function
    return () => {
      chartInstances.current.forEach(chart => {
        if (chart) {
          chart.destroy();
        }
      });
      chartInstances.current = [];
    };
  }, [loading, teacherActivityData, weeklyUsageData, coursePopularityData, studentProgressData]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-green-500 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Comprehensive system insights and real-time statistics.
          </p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Course Popularity Chart */}
          <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4 md:p-6">
            {loading ? (
              <div className="h-64 md:h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading course popularity...</p>
                </div>
              </div>
            ) : coursePopularityData ? (
              <div className="h-64 md:h-80">
                <canvas ref={courseChartRef} />
              </div>
            ) : (
              <div className="h-64 md:h-80 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No course data available</p>
              </div>
            )}
          </div>

          {/* Student Progress Chart */}
          <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4 md:p-6">
            {loading ? (
              <div className="h-64 md:h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading student progress...</p>
                </div>
              </div>
            ) : studentProgressData ? (
              <div className="h-64 md:h-80">
                <canvas ref={progressChartRef} />
              </div>
            ) : (
              <div className="h-64 md:h-80 flex items-center justify-center">
                <p className="text-gray-400 text-sm">No progress data available</p>
              </div>
            )}
          </div>

          {/* Teacher Activity Chart */}
          <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4 md:p-6">
            {loading ? (
              <div className="h-64 md:h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading teacher activity...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-64 md:h-80">
                  <canvas ref={teacherChartRef} />
                </div>
                {teacherActivityData && (teacherActivityData.topLessonsTeacher || teacherActivityData.topQuizzesTeacher) && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400">
                      🏆 <span className="text-green-400 font-semibold">Top Lessons:</span> {teacherActivityData.topLessonsTeacher || 'N/A'} • 
                      <span className="text-blue-400 font-semibold"> Top Quizzes:</span> {teacherActivityData.topQuizzesTeacher || 'N/A'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* System Usage Chart */}
          <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4 md:p-6">
            {loading ? (
              <div className="h-64 md:h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading usage trends...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-64 md:h-80">
                  <canvas ref={systemChartRef} />
                </div>
                {weeklyUsageData && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400">
                      📊 Active users include both students and teachers using the system this week
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsManage;