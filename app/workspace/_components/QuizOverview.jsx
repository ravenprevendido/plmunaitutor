"use client"
import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot
} from 'recharts';

function QuizOverview() {
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPerformanceData = async (subject = selectedSubject) => {
    try {
      setRefreshing(true);
      const url = subject === 'all' 
        ? '/api/student/monthly-performance'
        : `/api/student/monthly-performance?subject=${encodeURIComponent(subject)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      
      const data = await response.json();
      setPerformanceData(data);
      if (data.subjects && data.subjects.length > 0) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setPerformanceData({
        monthlyData: [],
        subjects: [],
        currentMonth: null,
        previousMonth: null,
        comparison: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchPerformanceData(selectedSubject);
    }
  }, [selectedSubject]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {payload[0].payload.monthLabel}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Performance: <span className="font-bold">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-white dark:bg-[#13181F] border border-gray-200 dark:border-[#232935] w-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!performanceData || !performanceData.monthlyData || performanceData.monthlyData.length === 0) {
    return (
      <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-white dark:bg-[#13181F] border border-gray-200 dark:border-[#232935] w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Performance</h3>
          <button 
            onClick={() => fetchPerformanceData()}
            disabled={refreshing}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No performance data available yet.</p>
          <p className="text-sm mt-2">Complete quizzes, assignments, and lessons to see your progress!</p>
        </div>
      </div>
    );
  }

  const { monthlyData, currentMonth, comparison } = performanceData;
  const currentMonthIndex = monthlyData.findIndex(m => m.month === currentMonth?.month);

  // Prepare data for Recharts
  const chartData = monthlyData.map((month, index) => ({
    name: month.monthLabel,
    performance: month.overall,
    monthLabel: month.monthLabel,
    isCurrent: index === currentMonthIndex,
    index: index
  }));

  // Generate secondary line data (smoothed/average)
  const secondaryData = monthlyData.map((month, index) => {
    if (index === 0) return month.overall;
    const prev = monthlyData[index - 1];
    return Math.round((prev.overall + month.overall) / 2);
  });

  const chartDataWithSecondary = chartData.map((item, index) => ({
    ...item,
    secondary: secondaryData[index]
  }));

  // Custom dot component for current month
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const isCurrentMonth = payload?.index === currentMonthIndex;
    
    if (isCurrentMonth) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#ffffff"
          stroke="#3b82f6"
          strokeWidth={3}
          className="drop-shadow-lg"
        />
      );
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#3b82f6"
        className="opacity-80"
      />
    );
  };

  return (
    <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-white dark:bg-[#13181F] border border-gray-200 dark:border-[#232935] w-full">
      {/* Header with Subject Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Performance</h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Subject Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full appearance-none bg-white dark:bg-[#1a202c] border border-blue-300 dark:border-blue-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={16} 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none"
            />
          </div>
          <button 
            onClick={() => fetchPerformanceData()}
            disabled={refreshing}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Line Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={chartDataWithSecondary}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              className="dark:stroke-gray-700"
              opacity={0.3}
            />
            <XAxis 
              dataKey="name" 
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              className="dark:stroke-gray-400"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Secondary line (lighter blue) */}
            <Line
              type="monotone"
              dataKey="secondary"
              stroke="#60a5fa"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6 }}
              opacity={0.7}
              animationDuration={1000}
            />
            
            {/* Main line (darker blue) */}
            <Line
              type="monotone"
              dataKey="performance"
              stroke="#2563eb"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 8, stroke: '#2563eb', strokeWidth: 2 }}
              animationDuration={1000}
              animationBegin={0}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-2 sm:gap-4">
        <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100">
          {currentMonth?.overall || 0}%
        </div>
        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Your productivity is <span className="font-semibold text-gray-900 dark:text-gray-100">{Math.abs(comparison)}%</span> {comparison >= 0 ? 'higher' : 'lower'} compared to last month
        </div>
      </div>
    </div>
  );
}

export default QuizOverview;
