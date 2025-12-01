// components/AdminSidebar.jsx
"use client";
import { Settings } from "lucide-react";
import { useState } from "react";

const AdminSidebar = ({ activeView, setActiveView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", completed: true },
    { id: "courses", label: "Course Management", icon: "📚", completed: true },
    { id: "teacher", label: "Teacher Management", icon: "📖", completed: true },
    { id: "enrollment", label: "Enroll Management", icon: "📝", completed: true },
    { id: "student", label: "Student Management", icon: "🎯", completed: true },
    { id: "analytics", label: "Analytics", icon: "📈", completed: true },
    { id: "tutor", label: "Settings", icon: <Settings size={20}/>, completed: true },
  ];

  const handleMenuClick = (itemId) => {
    setActiveView(itemId);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`bg-[#161b22] border-r border-gray-800 min-h-screen transition-all duration-300 ${
      isCollapsed ? "w-20" : "w-64"
    }`}>
      {/* Header with Toggle Button */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-green-500">PLMain AI Tutor</h1>
            <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-[#1f2937] hover:bg-[#374151] transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "➡️" : "⬅️"}
        </button>
      </div>
      
      {/* Navigation Menu */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item.id)}
            className={`w-full text-nowrap flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              activeView === item.id
                ? "bg-green-600 text-white shadow-lg"
                : "text-gray-300 hover:bg-[#1f2937] hover:text-white"
            } ${!item.completed ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!item.completed}
            title={isCollapsed ? item.label : ""}
          >
            <span className="text-lg">{item.icon}</span>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.completed ? (
                  <span className="text-green-400 text-sm"></span>
                ) : (
                  <span className="text-gray-500 text-sm"></span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>
      {/* Legend - Only show when expanded */}
      {/* Mini Legend for collapsed state */}
      {isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <div className="text-center">
            <div className="text-green-400 text-sm mb-1">✓</div>
            <div className="text-gray-500 text-sm">○</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSidebar;