'use client'
import React, { useState, useEffect, useRef } from 'react'
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController
} from 'chart.js'

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-white dark:bg-[#13181F] text-gray-900 dark:text-white p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 w-full">
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-48 mb-6"></div>
      
      {/* Top Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Subject Mastery Skeleton */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700/50">
          <div className="h-6 bg-gray-200 dark:bg-gray-700/50 rounded w-40 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-12"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gray-200 dark:from-gray-700/50 via-gray-300 dark:via-gray-600/50 to-gray-200 dark:to-gray-700/50 animate-shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Completion Rate Skeleton */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700/50 flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px]">
          <div className="h-6 bg-gray-200 dark:bg-gray-700/50 rounded w-48 mb-6"></div>
          <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 bg-gray-200 dark:bg-gray-700/50 rounded-full animate-pulse"></div>
          <div className="flex gap-4 mt-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-24"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700/50 rounded w-24"></div>
          </div>
        </div>
      </div>
      
      {/* Daily Study Time Skeleton */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700/50">
        <div className="h-6 bg-gray-200 dark:bg-gray-700/50 rounded w-56 mb-4"></div>
        <div className="flex items-end gap-3 h-40 justify-center">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div 
                className="w-8 bg-gray-200 dark:bg-gray-700/50 rounded-t animate-pulse"
                style={{ height: `${Math.random() * 60 + 20}px` }}
              ></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700/50 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    subjectMastery: [],
    lessonCompletionRate: { completed: 0, inProgress: 0, total: 0 },
    dailyStudyTime: []
  });
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const donutChartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (donutChartRef.current && analyticsData.lessonCompletionRate.total > 0) {
      const ctx = donutChartRef.current.getContext('2d');
      
      // Destroy existing chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const { completed, inProgress, total } = analyticsData.lessonCompletionRate;
      const notStarted = total - completed - inProgress;

      chartInstanceRef.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'In Progress', 'Not Started'],
          datasets: [{
            data: [completed, inProgress, notStarted],
            backgroundColor: [
              '#22c55e', // green
              '#eab308', // yellow
              '#6b7280'  // gray
            ],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [analyticsData.lessonCompletionRate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setIsVisible(false);
      const response = await fetch('/api/student-analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        // Trigger fade-in animation after data loads
        setTimeout(() => {
          setIsVisible(true);
        }, 100);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setIsVisible(true);
    }
  };

  // Calculate max height for study time bars
  const maxHours = analyticsData.dailyStudyTime.length > 0
    ? Math.max(...analyticsData.dailyStudyTime.map(d => d.hours), 1)
    : 1;

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#13181F] dark:via-[#1a2332] dark:to-[#13181F] text-gray-900 dark:text-white p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 w-full">
      {/* Header with Icon */}
      <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg shadow-green-500/20">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
        </div>
      </div>

      {/* Top Section: Mastery & Completion Rate */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Subject Mastery */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700/50 shadow-xl hover:shadow-2xl hover:border-green-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <div className="p-1.5 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Subject Mastery</h2>
          </div>
          {analyticsData.subjectMastery.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {analyticsData.subjectMastery.map((subject, i) => (
                <div 
                  key={i} 
                  className="group/item animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex justify-between items-center text-xs sm:text-sm mb-2 gap-2">
                    <span className="truncate flex-1 min-w-0 font-medium text-gray-900 dark:text-white group-hover/item:text-green-600 dark:group-hover/item:text-green-400 transition-colors">
                      {subject.title}
                    </span>
                    <span className="shrink-0 font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded-md">
                      {subject.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-400 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-green-500/30 relative overflow-hidden"
                      style={{ 
                        width: isVisible ? `${subject.percent}%` : '0%',
                        animationDelay: `${i * 150}ms`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">No enrolled courses yet</p>
            </div>
          )}
        </div>
        
        {/* Lesson Completion Rate (Donut Chart) */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px] border border-gray-300 dark:border-gray-700/50 shadow-xl hover:shadow-2xl hover:border-yellow-500/30 transition-all duration-300 group">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <div className="p-1.5 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-center">Lesson Complete Rate</h2>
          </div>
          {analyticsData.lessonCompletionRate.total > 0 ? (
            <>
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 mx-auto animate-fade-in-scale">
                <canvas ref={donutChartRef}></canvas>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {Math.round((analyticsData.lessonCompletionRate.completed / analyticsData.lessonCompletionRate.total) * 100)}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Complete</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4 sm:mt-5 text-xs sm:text-sm w-full">
                <div className="flex items-center justify-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-colors">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0 animate-pulse"></span> 
                  <span className="font-medium">Completed ({analyticsData.lessonCompletionRate.completed})</span>
                </div>
                <div className="flex items-center justify-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors">
                  <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full shrink-0 animate-pulse"></span> 
                  <span className="font-medium">In Progress ({analyticsData.lessonCompletionRate.inProgress})</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">No lessons, quizzes, or assignments yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Daily Study Time */}
      <div className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 w-full border border-gray-200 dark:border-gray-700/50 shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="p-1.5 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Daily Study Time (Last 7 Days)</h2>
        </div>
        <div className="flex items-end gap-2 sm:gap-3 md:gap-4 h-32 sm:h-40 justify-center overflow-x-auto pb-2">
          {analyticsData.dailyStudyTime.length > 0 ? (
            analyticsData.dailyStudyTime.map((entry, i) => {
              const height = maxHours > 0 ? (entry.hours / maxHours) * 100 : 0;
              return (
                <div 
                  key={i} 
                  className="flex flex-col items-center justify-end shrink-0 group/bar animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className="w-6 sm:w-7 md:w-8 lg:w-10 bg-gradient-to-t from-green-600 via-green-500 to-green-400 rounded-t transition-all duration-500 hover:from-green-500 hover:via-green-400 hover:to-green-300 cursor-pointer shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-105 relative overflow-hidden"
                    style={{ 
                      height: isVisible ? `${Math.max(height, 4)}px` : '4px',
                      minHeight: '4px',
                      transitionDelay: `${i * 50}ms`
                    }}
                    title={`${entry.hours.toFixed(1)} hours`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
                  </div>
                  <span className="text-xs mt-2 font-medium group-hover/bar:text-green-600 dark:group-hover/bar:text-green-400 transition-colors text-gray-700 dark:text-gray-300">{entry.day}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 hidden sm:block">{entry.hours.toFixed(1)}h</span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 w-full">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">No study time recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics