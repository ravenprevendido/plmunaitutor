"use client";
import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Mail, 
  Brain, 
  Database, 
  Users, 
  BookOpen, 
  Bell, 
  Shield, 
  Globe,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("system");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // System Settings
    system: {
      appName: "PLMun AI Tutor",
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      maintenanceMode: false,
      allowRegistrations: true,
      allowTeacherRequests: true,
    },
    // Email Settings
    email: {
      enabled: false,
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      smtpFrom: "",
      testEmail: "",
    },
    // AI Settings
    ai: {
      enabled: true,
      provider: "openrouter",
      defaultModel: "meta-llama/llama-3.1-8b-instruct",
      maxTokens: 1024,
      temperature: 0.7,
      apiKeyConfigured: false,
    },
    // User Management Settings
    users: {
      maxCoursesPerTeacher: 5,
      requireEmailVerification: false,
      allowStudentSelfEnrollment: true,
      defaultStudentRole: "student",
      sessionTimeout: 24, // hours
    },
    // Course Settings
    courses: {
      maxLessonsPerCourse: 50,
      maxQuizzesPerCourse: 20,
      maxAssignmentsPerCourse: 15,
      allowPublicCourses: false,
      requireApprovalForNewCourses: true,
    },
    // Notification Settings
    notifications: {
      emailNotifications: true,
      inAppNotifications: true,
      notifyOnNewLesson: true,
      notifyOnNewQuiz: true,
      notifyOnNewAssignment: true,
      notifyOnEnrollment: true,
      notifyOnTeacherRequest: true,
    },
    // Security Settings
    security: {
      requireStrongPasswords: true,
      passwordMinLength: 8,
      sessionTimeout: 24,
      enableRateLimiting: true,
      enableCSRFProtection: true,
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
    },
    // General Settings
    general: {
      timezone: "Asia/Manila",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      language: "en",
      theme: "dark",
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // In a real app, fetch from API
      // const response = await fetch('/api/admin/settings');
      // const data = await response.json();
      // setSettings(data);
      
      // For now, load from localStorage or use defaults
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // In a real app, save to API
      // await fetch('/api/admin/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings),
      // });
      
      // For now, save to localStorage
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const testEmailConnection = async () => {
    try {
      const response = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.email.testEmail,
        }),
      });
      
      if (response.ok) {
        toast.success("Test email sent successfully!");
      } else {
        toast.error("Failed to send test email");
      }
    } catch (error) {
      toast.error("Error testing email connection");
    }
  };

  const testAIConnection = async () => {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: "Test connection",
          mode: "chatbot",
        }),
      });
      
      if (response.ok) {
        toast.success("AI connection successful!");
      } else {
        toast.error("AI connection failed");
      }
    } catch (error) {
      toast.error("Error testing AI connection");
    }
  };

  const tabs = [
    { id: "system", label: "System", icon: Settings },
    { id: "email", label: "Email", icon: Mail },
    { id: "ai", label: "AI Configuration", icon: Brain },
    { id: "users", label: "Users", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "general", label: "General", icon: Globe },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-500 mb-2">Admin Settings</h1>
          <p className="text-gray-400">Configure system-wide settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-[#161b22] rounded-lg border border-gray-800 mb-6">
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* System Settings */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-400">System Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Application Name</label>
                      <input
                        type="text"
                        value={settings.system.appName}
                        onChange={(e) => updateSetting("system", "appName", e.target.value)}
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Application URL</label>
                      <input
                        type="url"
                        value={settings.system.appUrl}
                        onChange={(e) => updateSetting("system", "appUrl", e.target.value)}
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Maintenance Mode</h4>
                        <p className="text-sm text-gray-400">Temporarily disable access for all users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.system.maintenanceMode}
                          onChange={(e) => updateSetting("system", "maintenanceMode", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Allow New Registrations</h4>
                        <p className="text-sm text-gray-400">Enable or disable new user sign-ups</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.system.allowRegistrations}
                          onChange={(e) => updateSetting("system", "allowRegistrations", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Allow Teacher Requests</h4>
                        <p className="text-sm text-gray-400">Allow teachers to request course assignments</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.system.allowTeacherRequests}
                          onChange={(e) => updateSetting("system", "allowTeacherRequests", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === "email" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-400">Email Configuration</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Enable Email Notifications</h4>
                        <p className="text-sm text-gray-400">Send email notifications to users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email.enabled}
                          onChange={(e) => updateSetting("email", "enabled", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SMTP Host</label>
                      <input
                        type="text"
                        value={settings.email.smtpHost}
                        onChange={(e) => updateSetting("email", "smtpHost", e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">SMTP Port</label>
                        <input
                          type="number"
                          value={settings.email.smtpPort}
                          onChange={(e) => updateSetting("email", "smtpPort", parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700 mt-6">
                        <span className="text-sm">Use SSL/TLS</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.email.smtpSecure}
                            onChange={(e) => updateSetting("email", "smtpSecure", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SMTP Username</label>
                      <input
                        type="text"
                        value={settings.email.smtpUser}
                        onChange={(e) => updateSetting("email", "smtpUser", e.target.value)}
                        placeholder="your-email@gmail.com"
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">From Email Address</label>
                      <input
                        type="email"
                        value={settings.email.smtpFrom}
                        onChange={(e) => updateSetting("email", "smtpFrom", e.target.value)}
                        placeholder="PLMun AI Tutor <noreply@example.com>"
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Test Email Address</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={settings.email.testEmail}
                          onChange={(e) => updateSetting("email", "testEmail", e.target.value)}
                          placeholder="test@example.com"
                          className="flex-1 px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        />
                        <button
                          onClick={testEmailConnection}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        >
                          Test Connection
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-400">
                        <AlertCircle className="inline w-4 h-4 mr-2" />
                        Note: SMTP password should be configured in environment variables (SMTP_PASS) for security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Settings */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-400">AI Configuration</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Enable AI Features</h4>
                        <p className="text-sm text-gray-400">Enable AI tutor, quiz generation, and study plans</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.ai.enabled}
                          onChange={(e) => updateSetting("ai", "enabled", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">AI Provider</label>
                      <select
                        value={settings.ai.provider}
                        onChange={(e) => updateSetting("ai", "provider", e.target.value)}
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      >
                        <option value="openrouter">OpenRouter</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Model</label>
                      <input
                        type="text"
                        value={settings.ai.defaultModel}
                        onChange={(e) => updateSetting("ai", "defaultModel", e.target.value)}
                        placeholder="meta-llama/llama-3.1-8b-instruct"
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Tokens</label>
                        <input
                          type="number"
                          value={settings.ai.maxTokens}
                          onChange={(e) => updateSetting("ai", "maxTokens", parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Temperature (0-1)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={settings.ai.temperature}
                          onChange={(e) => updateSetting("ai", "temperature", parseFloat(e.target.value))}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-400">API Key Status</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {settings.ai.apiKeyConfigured ? "Configured" : "Not configured"}
                          </p>
                        </div>
                        {settings.ai.apiKeyConfigured ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={testAIConnection}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      Test AI Connection
                    </button>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-400">
                        <AlertCircle className="inline w-4 h-4 mr-2" />
                        API keys should be configured in environment variables (OPENROUTER_API_KEY) for security.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Management Settings */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-400">User Management</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Courses Per Teacher</label>
                      <input
                        type="number"
                        value={settings.users.maxCoursesPerTeacher}
                        onChange={(e) => updateSetting("users", "maxCoursesPerTeacher", parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">Limit the number of courses a teacher can manage</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Require Email Verification</h4>
                        <p className="text-sm text-gray-400">Users must verify their email before accessing the platform</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.users.requireEmailVerification}
                          onChange={(e) => updateSetting("users", "requireEmailVerification", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Allow Student Self-Enrollment</h4>
                        <p className="text-sm text-gray-400">Allow students to enroll in courses without approval</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.users.allowStudentSelfEnrollment}
                          onChange={(e) => updateSetting("users", "allowStudentSelfEnrollment", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Session Timeout (hours)</label>
                      <input
                        type="number"
                        value={settings.users.sessionTimeout}
                        onChange={(e) => updateSetting("users", "sessionTimeout", parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Course Settings */}
            {activeTab === "courses" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-400">Course Management</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Lessons</label>
                        <input
                          type="number"
                          value={settings.courses.maxLessonsPerCourse}
                          onChange={(e) => updateSetting("courses", "maxLessonsPerCourse", parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Quizzes</label>
                        <input
                          type="number"
                          value={settings.courses.maxQuizzesPerCourse}
                          onChange={(e) => updateSetting("courses", "maxQuizzesPerCourse", parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Assignments</label>
                        <input
                          type="number"
                          value={settings.courses.maxAssignmentsPerCourse}
                          onChange={(e) => updateSetting("courses", "maxAssignmentsPerCourse", parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Require Approval for New Courses</h4>
                        <p className="text-sm text-gray-400">New courses must be approved by admin before going live</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.courses.requireApprovalForNewCourses}
                          onChange={(e) => updateSetting("courses", "requireApprovalForNewCourses", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-400">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Email Notifications</h4>
                        <p className="text-sm text-gray-400">Send email notifications to users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailNotifications}
                          onChange={(e) => updateSetting("notifications", "emailNotifications", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">In-App Notifications</h4>
                        <p className="text-sm text-gray-400">Show notifications in the dashboard</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications.inAppNotifications}
                          onChange={(e) => updateSetting("notifications", "inAppNotifications", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div className="p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <h4 className="font-medium mb-3">Notification Types</h4>
                      <div className="space-y-2">
                        {[
                          { key: "notifyOnNewLesson", label: "New Lesson" },
                          { key: "notifyOnNewQuiz", label: "New Quiz" },
                          { key: "notifyOnNewAssignment", label: "New Assignment" },
                          { key: "notifyOnEnrollment", label: "Enrollment" },
                          { key: "notifyOnTeacherRequest", label: "Teacher Request" },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <span className="text-sm">{item.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.notifications[item.key]}
                                onChange={(e) => updateSetting("notifications", item.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-400">Security Configuration</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Require Strong Passwords</h4>
                        <p className="text-sm text-gray-400">Enforce password complexity requirements</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.requireStrongPasswords}
                          onChange={(e) => updateSetting("security", "requireStrongPasswords", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Minimum Password Length</label>
                      <input
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => updateSetting("security", "passwordMinLength", parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-gray-700">
                      <div>
                        <h4 className="font-medium">Enable Rate Limiting</h4>
                        <p className="text-sm text-gray-400">Protect against brute force attacks</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.enableRateLimiting}
                          onChange={(e) => updateSetting("security", "enableRateLimiting", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                        <input
                          type="number"
                          value={settings.security.maxLoginAttempts}
                          onChange={(e) => updateSetting("security", "maxLoginAttempts", parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Lockout Duration (minutes)</label>
                        <input
                          type="number"
                          value={settings.security.lockoutDuration}
                          onChange={(e) => updateSetting("security", "lockoutDuration", parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Settings */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-400">General Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Timezone</label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => updateSetting("general", "timezone", e.target.value)}
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      >
                        <option value="Asia/Manila">Asia/Manila (PHT)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Date Format</label>
                        <select
                          value={settings.general.dateFormat}
                          onChange={(e) => updateSetting("general", "dateFormat", e.target.value)}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Time Format</label>
                        <select
                          value={settings.general.timeFormat}
                          onChange={(e) => updateSetting("general", "timeFormat", e.target.value)}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                        >
                          <option value="12h">12-hour</option>
                          <option value="24h">24-hour</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Default Language</label>
                      <select
                        value={settings.general.language}
                        onChange={(e) => updateSetting("general", "language", e.target.value)}
                        className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
