// app/workspace/study-plan/pending/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ListChecks, ArrowLeft, Calendar, BookOpen, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PendingTasksPage() {
  const { user } = useUser();
  const router = useRouter();
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPendingTasks();
    }
  }, [user?.id]);

  const loadPendingTasks = async () => {
    try {
      const response = await fetch(`/api/study-plan?userId=${user.id}`);
      const data = await response.json();

      if (data.studyPlan) {
        const allPendingTasks = data.studyPlan.weeklySchedule.flatMap(day => 
          day.tasks.map(task => ({
            ...task,
            day: day.day,
            date: day.date,
            isToday: day.isToday
          }))
        );
        setPendingTasks(allPendingTasks);
      }
    } catch (error) {
      console.error('Error loading pending tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#161B22] text-gray-900 dark:text-white min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-600 dark:text-green-400">Loading pending tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161B22] text-gray-900 dark:text-white min-h-screen p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/workspace/study-plan')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg flex-shrink-0">
              <ListChecks size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Pending Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Tasks waiting to be completed</p>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3 sm:space-y-4">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => (
              <div key={task.id} className="bg-gray-50 dark:bg-[#1f2937] border border-blue-200 dark:border-blue-500/30 rounded-lg p-3 sm:p-4 hover:border-blue-500/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <BookOpen size={18} className="text-blue-400 mt-0.5 sm:mt-1 shrink-0 sm:w-5 sm:h-5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 dark:text-white font-medium text-base sm:text-lg mb-2 break-words">{task.text}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{task.day} {task.date}</span>
                          {task.isToday && (
                            <span className="bg-green-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs ml-2 whitespace-nowrap">Today</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="sm:w-3.5 sm:h-3.5 shrink-0" />
                          <span className="whitespace-nowrap">{task.estimatedTime || 10} minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="bg-blue-600 text-white px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap self-start sm:self-auto shrink-0">
                    Pending
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 sm:py-12 px-4">
              <ListChecks size={48} className="mx-auto text-gray-500 mb-4 sm:w-16 sm:h-16" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">No Pending Tasks</h3>
              <p className="text-gray-500 text-sm sm:text-base">All tasks are completed! Great job! 🎉</p>
              <button
                onClick={() => router.push('/workspace/study-plan')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                Back to Study Plan
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {pendingTasks.length > 0 && (
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div>
                <p className="text-blue-300 text-xs sm:text-sm">Total Pending Tasks</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{pendingTasks.length}</p>
              </div>
              <button
                onClick={() => router.push('/workspace/study-plan')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                Back to Study Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}