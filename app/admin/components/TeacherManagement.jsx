"use client";
import React, { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Trash2, Mail, BookOpen, RefreshCw } from "lucide-react";

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    await Promise.all([fetchTeachers(), fetchTeacherRequests()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchTeachers = async () => {
    try {
      console.log("🔄 Fetching teachers from new API...");
      const response = await fetch('/api/admin-teachers');
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Loaded ${data.length} teachers`);
        setTeachers(data);
      } else {
        console.error('❌ Failed to fetch teachers - API returned:', response.status);
        setTeachers([]);
      }
    } catch (error) {
      console.error('❌ Network error fetching teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherRequests = async () => {
    try {
      console.log("🔄 Fetching teacher requests from new API...");
      const response = await fetch('/api/admin-teacher-requests');
      
      if (response.ok) {
        const data = await response.json();
        const pendingRequests = data.filter(req => req.status === 'pending');
        console.log(`✅ Loaded ${pendingRequests.length} pending requests`);
        setTeacherRequests(pendingRequests);
      } else {
        console.error('❌ Failed to fetch teacher requests - API returned:', response.status);
        setTeacherRequests([]);
      }
    } catch (error) {
      console.error('❌ Network error fetching teacher requests:', error);
      setTeacherRequests([]);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      console.log(`✅ Approving request ${requestId}`);
      const response = await fetch('/api/admin-teacher-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: requestId,
          action: 'approved' 
        })
      });

      if (response.ok) {
        await fetchData();
        window.dispatchEvent(new CustomEvent('teacherRequestUpdated'));
        alert('Teacher request approved successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      console.log(`❌ Rejecting request ${requestId}`);
      const response = await fetch('/api/admin-teacher-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: requestId,
          action: 'rejected' 
        })
      });

      if (response.ok) {
        await fetchData();
        window.dispatchEvent(new CustomEvent('teacherRequestUpdated'));
        alert('Teacher request rejected.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting request');
    }
  };

  const handleRemoveTeacher = async (teacherId) => {
    if (confirm("Are you sure you want to remove this teacher? This will unassign them from all courses.")) {
      try {
        console.log(`🗑️ Removing teacher ${teacherId}`);
        const response = await fetch(`/api/admin-teachers?id=${teacherId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchData();
          alert('Teacher removed successfully!');
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to remove teacher');
        }
      } catch (error) {
        console.error('Error removing teacher:', error);
        alert('Error removing teacher');
      }
    }
  };

  const filteredTeachers = teachers.filter(
    t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequestsCount = teacherRequests.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-green-500" size={32} />
          <p>Loading teacher management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-500">Teacher Management</h1>
          <p className="text-gray-400 text-sm">
            Manage, verify, and assign teacher to each courses
          </p>
          {pendingRequestsCount > 0 && (
            <p className="text-yellow-400 text-sm mt-1">
              {pendingRequestsCount} pending teacher request{pendingRequestsCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#161b22] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Pending Requests Section */}
      {pendingRequestsCount > 0 && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
            <BookOpen size={16} />
            Pending Teacher Requests ({pendingRequestsCount})
          </h3>
          <div className="space-y-3">
            {teacherRequests.map(request => (
              <div key={request.id} className="bg-[#161b22] p-4 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-white">{request.teacher_name}</p>
                        <p className="text-sm text-gray-400">{request.teacher_email}</p>
                      </div>
                      <div>
                        <p className="text-green-400 font-semibold">{request.course_title}</p>
                        <p className="text-xs text-gray-500">
                          Category: {request.course_category} • {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm transition-colors"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm transition-colors"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teachers Table */}
      <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">All Teachers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead className="bg-[#1c2128] text-gray-400 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 text-left">Teacher Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-center">Total Courses</th>
                <th className="py-3 px-4 text-center">Course Title</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-800 hover:bg-[#1c2128] transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {teacher.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        {teacher.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        {teacher.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{teacher.total_courses || 0}</td>
                    <td className="py-3 px-4 text-center">{teacher.course_title || 'N/A'}</td>
                    <td className={`py-3 px-4 text-center font-semibold ${
                      teacher.status === "active" ? "text-green-500" :
                      teacher.status === "pending" ? "text-yellow-400" : "text-red-500"
                    }`}>
                      {teacher.status}
                    </td>
                    <td className="py-3 px-4 flex justify-center gap-3">
                      <button
                        onClick={() => handleRemoveTeacher(teacher.id)}
                        className="hover:text-red-500 p-1 rounded transition-colors"
                        title="Remove Teacher"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    {teachers.length === 0 ? 
                      "No teachers found. Teacher requests will appear here once approved." : 
                      "No teachers match your search."
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherManagement;