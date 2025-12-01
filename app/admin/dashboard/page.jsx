// components/AdminDashboard.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import toast from "react-hot-toast";

import CoursesView from "../components/CoursesView";
import AnalyticsView from "../components/AnalyticsView";
import DashboardView from "../components/DashboardView";
import AdminSidebar from "../components/AdminSidebar";
import TeacherManagement from "../components/TeacherManagement";
import CourseManagement from "../components/CourseManagement";
import EnrollmentManagement from "../components/EnrollmentManagement";
import StudentManagement from "../components/StudentManagement";
import AnalyticsManage from "../components/AnalyticsManage";

ChartJS.register(
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingTeacherRequests, setPendingTeacherRequests] = useState(0);
  const [activeTeachers, setActiveTeachers] = useState([]);
  const router = useRouter();

  // Get admin user data from localStorage
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('adminLoggedIn');
      const userData = localStorage.getItem('adminUser');
      
      if (!isLoggedIn) {
        router.push('/admin');
        return;
      }

      if (userData) {
        try {
          setAdminUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch teacher requests and setup real-time updates
  useEffect(() => {
    fetchTeacherRequests();
    fetchActiveTeachers();
    loadNotifications();

    // Set up real-time updates
    const handleTeacherRequestUpdate = () => {
      console.log("🔄 Teacher request update received");
      fetchTeacherRequests();
      fetchActiveTeachers();
    };

    const handleNewTeacherRequest = (event) => {
      console.log("📨 New teacher request received:", event.detail);
      const newRequest = event.detail;
      
      // Add to notifications
      addNotification({
        icon: "📚",
        text: `${newRequest.teacher_name} requested to manage "${newRequest.course_title}"`,
        time: "Just now",
        type: "course_request",
        requestId: newRequest.id,
        teacherName: newRequest.teacher_name,
        courseTitle: newRequest.course_title,
        teacherEmail: newRequest.teacher_email
      });
      
      // Update pending count
      fetchTeacherRequests();
    };

    // Listen for teacher login activity (you can trigger this from teacher pages)
    const handleTeacherActivity = (event) => {
      console.log("👨‍🏫 Teacher activity detected:", event.detail);
      const { teacherName, action, courseTitle } = event.detail;
      
      let notificationText = "";
      let icon = "👨‍🏫";

      switch (action) {
        case 'login':
          notificationText = `${teacherName} is now active`;
          icon = "🟢";
          break;
        case 'course_accessed':
          notificationText = `${teacherName} accessed "${courseTitle}"`;
          icon = "📖";
          break;
        case 'content_updated':
          notificationText = `${teacherName} updated content in "${courseTitle}"`;
          icon = "✏️";
          break;
        default:
          notificationText = `${teacherName} performed an action`;
      }

      addNotification({
        icon: icon,
        text: notificationText,
        time: "Just now",
        type: "teacher_activity",
        teacherName: teacherName,
        courseTitle: courseTitle,
        action: action
      });
    };

    window.addEventListener('teacherRequestUpdated', handleTeacherRequestUpdate);
    window.addEventListener('newTeacherRequest', handleNewTeacherRequest);
    window.addEventListener('teacherActivity', handleTeacherActivity);

    // Simulate teacher activities for demo (remove in production)
    const demoInterval = setInterval(() => {
      const demoTeachers = ['Raven Prevendido', 'Maria Garcia', 'John Smith'];
      const demoCourses = ['Web Development', 'Python Fundamentals', 'Java Programming'];
      const demoActions = ['login', 'course_accessed', 'content_updated'];
      
      const randomTeacher = demoTeachers[Math.floor(Math.random() * demoTeachers.length)];
      const randomCourse = demoCourses[Math.floor(Math.random() * demoCourses.length)];
      const randomAction = demoActions[Math.floor(Math.random() * demoActions.length)];
      
      // Only trigger occasionally for demo
      if (Math.random() < 0.3) { // 30% chance
        window.dispatchEvent(new CustomEvent('teacherActivity', {
          detail: {
            teacherName: randomTeacher,
            action: randomAction,
            courseTitle: randomAction !== 'login' ? randomCourse : null
          }
        }));
      }
    }, 60000); // Every minute

    return () => {
      window.removeEventListener('teacherRequestUpdated', handleTeacherRequestUpdate);
      window.removeEventListener('newTeacherRequest', handleNewTeacherRequest);
      window.removeEventListener('teacherActivity', handleTeacherActivity);
      clearInterval(demoInterval);
    };
  }, []);

  // Fetch pending teacher requests
  const fetchTeacherRequests = async () => {
    try {
      const response = await fetch('/api/admin-teacher-requests');
      if (response.ok) {
        const requests = await response.json();
        const pending = requests.filter(req => req.status === 'pending');
        setPendingTeacherRequests(pending.length);
        
        // Add notifications for new pending requests that aren't in notifications yet
        pending.forEach(request => {
          const exists = notifications.some(notif => 
            notif.type === 'course_request' && notif.requestId === request.id
          );
          
          if (!exists) {
            addNotification({
              icon: "📚",
              text: `${request.teacher_name} requested to manage "${request.course_title}"`,
              time: new Date(request.created_at).toLocaleTimeString(),
              type: "course_request",
              requestId: request.id,
              teacherName: request.teacher_name,
              courseTitle: request.course_title,
              teacherEmail: request.teacher_email,
              read: false
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching teacher requests:', error);
    }
  };

  // Fetch active teachers
  const fetchActiveTeachers = async () => {
    try {
      const response = await fetch('/api/admin-teachers');
      if (response.ok) {
        const teachers = await response.json();
        const active = teachers.filter(teacher => teacher.status === 'active');
        setActiveTeachers(active);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  // Load notifications from localStorage
  const loadNotifications = () => {
    try {
      const savedNotifications = localStorage.getItem('adminNotifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } else {
        // Default notifications
        const defaultNotifications = [
          {
            id: 1,
            icon: "👋",
            text: "Welcome to the admin dashboard!",
            time: "Just now",
            type: "system",
            read: false,
          },
          {
            id: 2,
            icon: "📊",
            text: "New analytics data available for review",
            time: "30 minutes ago",
            type: "analytics",
            read: false,
          }
        ];
        setNotifications(defaultNotifications);
        setUnreadCount(2);
        saveNotifications(defaultNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Save notifications to localStorage
  const saveNotifications = (notifs) => {
    try {
      localStorage.setItem('adminNotifications', JSON.stringify(notifs));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  // Add new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      read: false,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // Keep last 50
      setUnreadCount(updated.filter(n => !n.read).length);
      saveNotifications(updated);
      return updated;
    });

    // Show toast for important notifications
    if (notification.type === 'course_request') {
      toast.success(`New course request from ${notification.teacherName}`, {
        icon: '📚',
        duration: 5000,
        style: {
          background: "#3b82f6",
          color: "#fff",
        }
      });
    }
  };

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      );
      setUnreadCount(updated.filter(n => !n.read).length);
      saveNotifications(updated);
      return updated;
    });
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, read: true }));
      setUnreadCount(0);
      saveNotifications(updated);
      return updated;
    });
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    if (notification.type === 'course_request') {
      setActiveView('teacher');
      setShowNotifications(false);
    } else if (notification.type === 'teacher_activity') {
      setActiveView('teacher');
      setShowNotifications(false);
    }
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    saveNotifications([]);
  };

  const handleNotificationBellClick = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const handleAvatarClick = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminNotifications');
    toast.success("Logged out successfully!", {
      icon: '👋',
      style: {
        background: "#22c55e",
        color: "#fff",
      }
    });
    router.push('/admin');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu') && !event.target.closest('.notification-menu')) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Component mapping
  const viewComponents = {
    dashboard: <DashboardView pendingRequests={pendingTeacherRequests} />,
    courses: <CourseManagement/>,
    analytics: <AnalyticsManage/>,
    teacher: <TeacherManagement/>,
    enrollment: <EnrollmentManagement/>,
    student: <StudentManagement/>
  };

  // Format time for notifications
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return time.toLocaleDateString();
  };

  // Filter notifications by type
  const getNotificationBadge = (type) => {
    switch (type) {
      case 'course_request':
        return { text: 'Course Request', color: 'bg-blue-500/20 text-blue-400' };
      case 'teacher_activity':
        return { text: 'Teacher Active', color: 'bg-green-500/20 text-green-400' };
      case 'system':
        return { text: 'System', color: 'bg-gray-500/20 text-gray-400' };
      case 'analytics':
        return { text: 'Analytics', color: 'bg-purple-500/20 text-purple-400' };
      default:
        return { text: 'Notification', color: 'bg-gray-500/20 text-gray-400' };
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex">
      {/* Sidebar */}
      <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-green-500 capitalize">
              {activeView.replace(/([A-Z])/g, ' $1')}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Welcome back, {adminUser?.name || "Admin"}!
              {pendingTeacherRequests > 0 && (
                <span className="ml-2 text-yellow-400">
                  • {pendingTeacherRequests} pending teacher request{pendingTeacherRequests > 1 ? 's' : ''}
                </span>
              )}
              {activeTeachers.length > 0 && (
                <span className="ml-2 text-green-400">
                  • {activeTeachers.length} active teacher{activeTeachers.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          
          {/* Notifications and User Menu */}
          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <div className="relative notification-menu">
              <button
                onClick={handleNotificationBellClick}
                className="relative p-2 bg-[#161b22] rounded-lg border border-gray-800 hover:bg-[#1f2937] transition-colors"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-96 bg-[#161b22] border border-gray-800 rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-green-500">Notifications</h3>
                      <p className="text-xs text-gray-400">
                        {unreadCount} unread • {notifications.length} total
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-500/10"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => {
                        const badge = getNotificationBadge(notification.type);
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 border-b border-gray-800 hover:bg-[#1f2937] cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-xl mt-1">{notification.icon}</span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-200">{notification.text}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`inline-block px-2 py-1 text-xs rounded ${badge.color}`}>
                                    {badge.text}
                                  </span>
                                  {notification.courseTitle && (
                                    <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                                      {notification.courseTitle}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  {formatTime(notification.timestamp || notification.time)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <div className="text-4xl mb-2">🔔</div>
                        <p>No notifications</p>
                        <p className="text-sm mt-1">All caught up!</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-800 bg-[#1a2230]">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Active Teachers: {activeTeachers.length}</span>
                      <span>Pending Requests: {pendingTeacherRequests}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setActiveView('teacher');
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-sm text-green-500 hover:text-green-400 py-2 mt-2 rounded bg-green-500/10 hover:bg-green-500/20 transition-colors"
                    >
                      📊 View Teacher Management
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar and Dropdown */}
            <div className="relative user-menu">
              <button 
                onClick={handleAvatarClick}
                className="flex items-center gap-3 bg-[#161b22] p-2 rounded-lg border border-gray-800 hover:bg-[#1f2937] transition-colors"
              >
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {(adminUser?.name?.[0] || 'A').toUpperCase()}
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{adminUser?.name || "Admin"}</p>
                  <p className="text-xs text-gray-400"></p>
                </div>
                <span className="text-gray-400">▼</span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-12 w-48 bg-[#161b22] border border-gray-800 rounded-lg shadow-xl z-50">
                  <div className="p-3 border-b border-gray-800">
                    <p className="text-sm font-medium">{adminUser?.name || "Admin"}</p>
                    <p className="text-xs text-gray-400">{adminUser?.email}</p>
                  </div>
                  <div className="p-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-20 rounded-md transition-colors flex items-center gap-2"
                    >
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        {viewComponents[activeView] || <div>Coming Soon: {activeView}</div>}
      </div>
    </div>
  );
};

export default AdminDashboard;