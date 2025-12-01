// app/workspace/study-plan/focus-areas/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Target, ArrowLeft, BookOpen, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FocusAreasPage() {
  const { user } = useUser();
  const router = useRouter();
  const [focusAreas, setFocusAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadFocusAreas();
    }
  }, [user?.id]);

  const loadFocusAreas = async () => {
    try {
      const response = await fetch(`/api/study-plan?userId=${user.id}`);
      const data = await response.json();

      if (data.studyPlan) {
        setFocusAreas(data.studyPlan.focusAreas || []);
      }
    } catch (error) {
      console.error('Error loading focus areas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#161B22] text-gray-900 dark:text-white min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-600 dark:text-green-400">Loading focus areas...</p>
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
            <div className="p-2 bg-purple-600 rounded-lg">
              <Target size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Focus Areas</h1>
              <p className="text-gray-600 dark:text-gray-400">Your current learning priorities</p>
            </div>
          </div>
        </div>

        {/* Focus Areas List */}
        <div className="grid gap-4 md:grid-cols-2">
          {focusAreas.length > 0 ? (
            focusAreas.map((area, index) => (
              <div key={index} className="bg-gray-50 dark:bg-[#1f2937] border border-purple-200 dark:border-purple-500/30 rounded-lg p-6 hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <BookOpen size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{area}</h3>
                </div>
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300">
                  <TrendingUp size={16} />
                  <span className="text-sm">Priority Area for Improvement</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                  Focus on practical exercises and projects to strengthen your understanding in this area.
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <Target size={64} className="mx-auto text-gray-500 dark:text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No Focus Areas</h3>
              <p className="text-gray-600 dark:text-gray-500">Generate a study plan to see your focus areas!</p>
              <button
                onClick={() => router.push('/workspace/study-plan')}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Back to Study Plan
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {focusAreas.length > 0 && (
          <div className="mt-8 p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">Total Focus Areas</p>
                <p className="text-2xl font-bold text-white">{focusAreas.length}</p>
              </div>
              <button
                onClick={() => router.push('/workspace/study-plan')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
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