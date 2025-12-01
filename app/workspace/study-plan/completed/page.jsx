// app/workspace/study-plan/completed/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Trophy, ArrowLeft, CheckCircle2, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CompletedTasksPage() {
  const { user } = useUser();
  const router = useRouter();
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadCompletedTasks();
    }
  }, [user?.id]);

  const loadCompletedTasks = async () => {
    try {
      const response = await fetch(`/api/study-plan/completed?userId=${user.id}`);
      const data = await response.json();
      setCompletedTasks(data.completedTasks || []);
    } catch (error) {
      console.error('Error loading completed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#161B22] text-gray-900 dark:text-white min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-600 dark:text-green-400">Loading completed tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#161B22] text-gray-900 dark:text-white min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/workspace/study-plan')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Trophy size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Completed Tasks</h1>
              <p className="text-gray-600 dark:text-gray-400">Your learning accomplishments</p>
            </div>
          </div>
        </div>

        {/* Completed Tasks List */}
        <div className="space-y-4">
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => (
              <div key={task.id} className="bg-gray-50 dark:bg-[#1f2937] border border-green-200 dark:border-green-500/30 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-white font-medium text-lg mb-2">{task.text}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Completed
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Trophy size={64} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Completed Tasks Yet</h3>
              <p className="text-gray-500">Complete some tasks to see them here!</p>
              <button
                onClick={() => router.push('/workspace/study-plan')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Back to Study Plan
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {completedTasks.length > 0 && (
          <div className="mt-8 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Total Completed Tasks</p>
                <p className="text-2xl font-bold text-white">{completedTasks.length}</p>
              </div>
              <button
                onClick={() => router.push('/workspace/study-plan')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
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