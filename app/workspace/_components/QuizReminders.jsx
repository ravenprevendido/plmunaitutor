"use client"
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';

function QuizReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuizReminders();
  }, []);

  const fetchQuizReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/student/quiz-reminders');
      
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      } else {
        throw new Error('Failed to fetch quiz reminders');
      }
    } catch (error) {
      console.error('Error fetching quiz reminders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'High Priority') {
      return <AlertTriangle size={14} className="text-red-500" />;
    }
    return <Clock size={14} className="text-blue-500" />;
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High Priority') {
      return 'text-red-500';
    } else if (priority === 'Medium Priority') {
      return 'text-yellow-500';
    }
    return 'text-gray-500';
  };

  const getDotColor = (priority) => {
    if (priority === 'High Priority') {
      return 'bg-red-500';
    } else if (priority === 'Medium Priority') {
      return 'bg-yellow-500';
    }
    return 'bg-blue-500';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#13181F] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#232935] md:w-full md:-ml-0 w-82 -ml-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">Quiz Reminders</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full mt-2"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#13181F] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#232935] md:w-full md:-ml-0 w-82 -ml-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white text-center">Quiz Reminders</h3>
        <div className="text-center py-4">
          <p className="text-red-600 dark:text-red-400 text-sm mb-2">Failed to load reminders</p>
          <button 
            onClick={fetchQuizReminders}
            className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-700 dark:hover:text-blue-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#13181F] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#232935] md:w-full md:-ml-0 w-82 -ml-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz Reminders</h3>
        <button
          onClick={fetchQuizReminders}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>
      
      {reminders.length === 0 ? (
        <div className="text-center py-6">
          <Calendar size={32} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">No upcoming quizzes</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">New quizzes will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <div 
              key={reminder.id} 
              className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer bg-gray-50 dark:bg-transparent"
              onClick={() => window.location.href = `/workspace/my-courses/${reminder.course_id}/quiz/${reminder.id}`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 ${getDotColor(reminder.priority)}`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white opacity-90 truncate">
                  {reminder.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {reminder.course}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={12} className="text-gray-500 dark:text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {reminder.timeRemaining}
                  </p>
                </div>
                {reminder.priority && ( 
                  <div className="flex items-center gap-1 mt-2">
                    {getPriorityIcon(reminder.priority)}
                    <span className={`text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                      {reminder.priority}
                    </span>
                  </div>
                )}
                
                {/* Deadline date if available */}
                {reminder.deadline && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar size={12} className="text-gray-500 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Due: {new Date(reminder.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reminders Summary */}
      {reminders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
            <span>
              {reminders.length} upcoming quiz{reminders.length !== 1 ? 'zes' : ''}
            </span>
            <span>
              {reminders.filter(r => r.priority === 'High Priority').length} high priority
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizReminders;