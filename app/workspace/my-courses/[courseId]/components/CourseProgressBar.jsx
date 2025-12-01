"use client";
import { useState, useEffect } from "react";
import { CheckCircle, FileText, ListCheck } from "lucide-react";

export default function CourseProgressBar({ courseId, lessonsCount, quizzesCount, assignmentsCount, studentProgress }) {
  
  const progress = studentProgress || {
    lessonsCompleted: 0,
    quizzesCompleted: 0,
    assignmentsSubmitted: 0
  };

  const overallProgress = lessonsCount > 0 
    ? Math.round((progress.lessonsCompleted / lessonsCount) * 100) 
    : 0;

  return (
    <div className="bg-white dark:bg-[#1a1d24] p-6 rounded-lg space-y-4 shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Course Progress</h2>
      
      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
          <span>Overall Progress</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Detailed Progress */}
      <ul className="text-sm space-y-3 text-gray-900 dark:text-white">
        <li className="flex items-center gap-2">
          <CheckCircle className="text-green-600 dark:text-green-400 w-4 h-4"/>
          <span>{progress.lessonsCompleted}/{lessonsCount} Lessons Viewed</span>
        </li>
        <li className="flex items-center gap-2">
          <ListCheck className="text-yellow-600 dark:text-yellow-400 w-4 h-4"/>
          <span>{progress.quizzesCompleted}/{quizzesCount} Quizzes Completed</span>
        </li>
        <li className="flex items-center gap-2">
          <FileText className="text-blue-600 dark:text-blue-400 w-4 h-4"/>
          <span>{progress.assignmentsSubmitted}/{assignmentsCount} Assignments Submitted</span>
        </li>
      </ul>
    </div>
  );
}