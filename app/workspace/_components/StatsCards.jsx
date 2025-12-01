"use client"
import React, { useState, useEffect } from 'react'
import { Book, Clock, Award } from 'lucide-react'

function StatsCards() {
  const [stats, setStats] = useState({
    coursesInProgress: 0,
    coursesCompleted: 0,
    upcomingQuizzes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/student/dashboard-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch dashboard stats');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statsConfig = [
    {
      title: "Course In Progress",
      value: stats.coursesInProgress,
      icon: Book,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Course Completed",
      value: stats.coursesCompleted,
      icon: Award,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Upcoming Quizzes",
      value: stats.upcomingQuizzes,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:w-full md:ml-0 w-82 -ml-6">
      {statsConfig.map((stat, index) => (
        <div key={index} className="bg-white dark:bg-[#13181F] border border-gray-200 dark:border-[#232935] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-700 dark:text-gray-100">{stat.title}</h3>
              {loading ? (
                <div className="h-9 w-12 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
              ) : (
                <p className="text-3xl text-green-600 dark:text-green-500 font-bold mt-1">{stat.value}</p>
              )}
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor} dark:bg-opacity-20`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards
