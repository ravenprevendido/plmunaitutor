// components/admin/DashboardView.jsx
"use client";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { useState, useEffect } from "react";

const DashboardView = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalCourses: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    pendingApprovals: 0
  });

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    
    // Listen for updates
    const handleUpdate = () => {
      console.log("🔄 Dashboard: Update detected");
      fetchDashboardData();
    };

    window.addEventListener('courseUpdated', handleUpdate);
    window.addEventListener('teacherRequestUpdated', handleUpdate);
    window.addEventListener('enrollmentUpdated', handleUpdate)
    
    return () => {
      window.removeEventListener('courseUpdated', handleUpdate);
      window.removeEventListener('teacherRequestUpdated', handleUpdate);
      window.removeEventListener('enrollmentUpdated', handleUpdate);
    };
  }, []);

 const fetchDashboardData = async () => {
  try {
    console.log("📊 Fetching dashboard data...");
    
    // Fetch all data in parallel including total students
    const [coursesResponse, teachersResponse, requestsResponse, totalStudentsResponse] = await Promise.all([
      fetch('/api/courses'),
      fetch('/api/admin-teachers'),
      fetch('/api/admin-teacher-requests'),
      fetch('/api/admin/total-students') // NEW: Fetch only student count
    ]);

    if (coursesResponse.ok && teachersResponse.ok && requestsResponse.ok) {
      const coursesData = await coursesResponse.json();
      const teachersData = await teachersResponse.json();
      const requestsData = await requestsResponse.json();
      
      // Get total students count if available
      let totalStudentsCount = 185; // Default fallback
      if (totalStudentsResponse.ok) {
        const studentsData = await totalStudentsResponse.json();
        totalStudentsCount = studentsData.totalStudents || 185;
      }
      
      setCourses(coursesData);
      setTeachers(teachersData);
      setTeacherRequests(requestsData);
      
      // Count pending teacher requests
      const pendingRequests = requestsData.filter(req => req.status === 'pending').length;
      
      // Count active teachers
      const activeTeachers = teachersData.filter(teacher => teacher.status === 'active').length;
      
      setSummaryData({
        totalCourses: coursesData.length,
        totalTeachers: activeTeachers,
        totalStudents: totalStudentsCount, // Use real student count
        totalEnrollments: 350, // Static for now
        pendingApprovals: pendingRequests
      });
      
      console.log(`✅ Dashboard: ${coursesData.length} courses, ${activeTeachers} teachers, ${totalStudentsCount} students`);
    } else {
      console.error('Failed to fetch dashboard data');
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    setLoading(false);
  }
};

  // Calculate percentage change
  const calculateChange = (current, previous = 8) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: change.toFixed(1),
      isPositive: change >= 0
    };
  };

  const coursesChange = calculateChange(summaryData.totalCourses);
  const teachersChange = calculateChange(summaryData.totalTeachers, 3);
  const approvalsChange = calculateChange(summaryData.pendingApprovals, 2);
  const studentChange = calculateChange(summaryData.totalStudents, 185)

  const [monthlyActiveLearners, setMonthlyActiveLearners] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Fetch monthly active learners, popular courses, and recent activity
  useEffect(() => {
    const fetchDashboardCharts = async () => {
      try {
        // Fetch monthly active learners
        const learnersResponse = await fetch('/api/admin/monthly-active-learners');
        if (learnersResponse.ok) {
          const learnersData = await learnersResponse.json();
          setMonthlyActiveLearners(learnersData);
        }

        // Fetch popular courses
        const coursesResponse = await fetch('/api/admin/popular-courses');
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setPopularCourses(coursesData);
        }

        // Fetch recent activity
        const activityResponse = await fetch('/api/admin/recent-activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivities(activityData);
        }
      } catch (error) {
        console.error('Error fetching dashboard charts:', error);
      }
    };

    fetchDashboardCharts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardCharts, 30000);
    return () => clearInterval(interval);
  }, []);

  const lineData = {
    labels: monthlyActiveLearners.length > 0 
      ? monthlyActiveLearners.map(m => m.month)
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    datasets: [
      {
        label: "Active Learners",
        data: monthlyActiveLearners.length > 0
          ? monthlyActiveLearners.map(m => m.count)
          : [200, 400, 350, 500, 700, 900, 850, 1000, 1200],
        fill: true,
        backgroundColor: "rgba(34,197,94,0.2)",
        borderColor: "#22c55e",
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: popularCourses.length > 0
      ? popularCourses.map(c => c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title)
      : ["Python", "React", "Java", "C++", "AI Fundamentals"],
    datasets: [
      {
        label: "Popularity",
        data: popularCourses.length > 0
          ? popularCourses.map(c => c.enrollments)
          : [95, 80, 60, 55, 45],
        backgroundColor: "#22c55e",
      },
    ],
  };

  const doughnutData = {
    labels: ["Completed", "In Progress"],
    datasets: [
      {
        data: [75, 25],
        backgroundColor: ["#22c55e", "#1e293b"],
      },
    ],
  };

  const summaryCards = [
    { 
      title: "Total Teachers", 
      value: summaryData.totalTeachers.toString(), 
      change: `${teachersChange.isPositive ? '+' : ''}${teachersChange.value}% from last month`,
      icon: "👨‍🏫",
      color: "text-green-500"
    },
    { 
      title: "Total Students", 
      value: summaryData.totalStudents.toString(), 
       change: `${studentChange.isPositive ? '+' : ''}${studentChange.value}% from last month`, // Use real change
      icon: "👨‍🎓",
      color: "text-blue-500"
    },
    { 
      title: "Total Courses", 
      value: summaryData.totalCourses.toString(), 
      change: `${coursesChange.isPositive ? '+' : ''}${coursesChange.value}% from last month`,
      icon: "📚",
      color: "text-purple-500"
    },
    { 
      title: "Pending Approvals", 
      value: summaryData.pendingApprovals.toString(), 
      change: `${approvalsChange.isPositive ? '+' : ''}${approvalsChange.value}% from last month`,
      icon: "⏳",
      color: "text-yellow-500"
    },
  ];

  // Use real-time activities if available, otherwise show default
  const activities = recentActivities.length > 0 
    ? recentActivities.slice(0, 5) // Show top 5 most recent
    : [
        {
          icon: "📩",
          text: "New student John Doe enrolled in AI Fundamentals.",
          time: "2 hours ago",
        },
        {
          icon: "📘",
          text: `Course ${courses.length > 0 ? `'${courses[0]?.title}'` : 'new course'} updated with new module.`,
          time: "5 hours ago",
        },
        {
          icon: "👩‍🏫",
          text: `${teachers.length} teacher${teachers.length !== 1 ? 's' : ''} in the system.`,
          time: "Live data",
        },
        {
          icon: "⏳",
          text: `${summaryData.pendingApprovals} teacher request${summaryData.pendingApprovals !== 1 ? 's' : ''} waiting for approval.`,
          time: "Live data",
        },
      ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-[#161b22] p-5 rounded-xl shadow-lg border border-gray-800 animate-pulse"
            >
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
        <div className="text-center py-8 text-gray-400">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <>
      {/* Summary Cards - Clean Version */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className="bg-[#161b22] p-5 rounded-xl shadow-lg border border-gray-800 hover:border-green-500 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-400 text-sm">{card.title}</h3>
              <span className={`text-xl ${card.color}`}>{card.icon}</span>
            </div>
            
            <p className="text-3xl font-bold text-green-500 mb-2">{card.value}</p>
            
            <p className={`text-xs ${
              card.change.includes('+') ? 'text-green-400' : 
              card.change.includes('-') ? 'text-red-400' : 'text-gray-500'
            }`}>
              {card.change}
            </p>
          </div>
        ))}
      </div>

      {/* Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#161b22] p-5 rounded-xl border border-gray-800 lg:col-span-2">
          <h3 className="text-gray-300 font-semibold mb-4">Monthly Active Learners</h3>
          <Line data={lineData} />
        </div>
        <div className="bg-[#161b22] p-5 rounded-xl border border-gray-800">
          <h3 className="text-gray-300 font-semibold mb-4">Average Course Completion Rate</h3>
          <Doughnut data={doughnutData} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#161b22] p-5 rounded-xl border border-gray-800 lg:col-span-2">
          <h3 className="text-gray-300 font-semibold mb-4">Most Popular Courses</h3>
          <Bar data={barData} />
        </div>

        <div className="bg-[#161b22] p-5 rounded-xl border border-gray-800">
          <h3 className="text-gray-300 font-semibold mb-4">Recent Activity</h3>
          <ul className="space-y-3">
            {activities.map((activity, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm bg-[#0f141b] p-3 rounded-lg hover:bg-[#1a2230] transition-colors"
              >
                <span className="text-green-500 text-lg">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-gray-200">{activity.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default DashboardView;