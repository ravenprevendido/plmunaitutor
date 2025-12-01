"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  BookOpen,
  User,
  Filter,
  RefreshCw,
} from "lucide-react";

const EnrollmentManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setRefreshing(true);
      console.log("📋 Fetching enrollments...");
      const response = await fetch('/api/admin/enrollments');
      if (response.ok) {
        const data = await response.json();
        setEnrollments(data);
        console.log(`✅ Loaded ${data.length} enrollments`);
      } else {
        console.error('Failed to fetch enrollments');
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Approve enrollment
  const handleApprove = async (id) => {
    try {
      const response = await fetch('/api/admin/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: id, action: 'approved' })
      });

      if (response.ok) {
        fetchEnrollments();
        alert('Enrollment approved successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to approve enrollment');
      }
    } catch (error) {
      console.error('Error approving enrollment:', error);
      alert('Error approving enrollment');
    }
  };

  // Reject enrollment
  const handleReject = async (id) => {
    if (confirm("Are you sure you want to reject this enrollment?")) {
      try {
        const response = await fetch('/api/admin/enrollments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrollmentId: id, action: 'rejected' })
        });

        if (response.ok) {
          fetchEnrollments();
          alert('Enrollment rejected.');
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to reject enrollment');
        }
      } catch (error) {
        console.error('Error rejecting enrollment:', error);
        alert('Error rejecting enrollment');
      }
    }
  };

  // Search & filter logic
  const filteredEnrollments = enrollments.filter((e) => {
    const matchesSearch =
      e.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.teacher_name && e.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === "All" || e.status === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-green-500" size={32} />
          <p>Loading enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-green-500">
          Enrollment Management
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by student, course, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#161b22] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-full sm:w-40">
            <Filter
              size={18}
              className="absolute left-3 top-2.5 text-gray-400"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-[#161b22] border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-300 focus:ring-1 focus:ring-green-500 appearance-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchEnrollments}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto bg-[#161b22] border border-gray-800 rounded-lg shadow-lg">
        <table className="w-full text-sm text-gray-300 min-w-[600px]">
          <thead className="bg-[#1c2128] text-gray-400 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Student Name</th>
              <th className="py-3 px-4 text-left font-medium">Course</th>
              <th className="py-3 px-4 text-left font-medium">Teacher</th>
              <th className="py-3 px-4 text-center font-medium">Status</th>
              <th className="py-3 px-4 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredEnrollments.length > 0 ? (
              filteredEnrollments.map((e) => (
                <tr
                  key={e.id}
                  className="hover:bg-[#1c2128] transition-colors duration-150"
                >
                  {/* Student Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                        <User size={14} className="text-white" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-200 block">{e.student_name}</span>
                        <span className="text-xs text-gray-400">{e.student_email}</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Course */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <BookOpen size={16} className="text-gray-400 shrink-0" />
                      <span className="text-gray-300">{e.course_title}</span>
                    </div>
                  </td>
                  
                  {/* Teacher */}
                  <td className="py-4 px-4">
                    <span className="text-gray-300">{e.teacher_name || 'Not assigned'}</span>
                  </td>
                  
                  {/* Status */}
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          e.status === "approved"
                            ? "bg-green-900/30 text-green-400 border border-green-800"
                            : e.status === "rejected"
                            ? "bg-red-900/30 text-red-400 border border-red-800"
                            : "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                        }`}
                      >
                        {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-2">
                      {e.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleApprove(e.id)}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200"
                            title="Approve"
                          >
                            <CheckCircle size={16} className="text-white" />
                          </button>
                          <button
                            onClick={() => handleReject(e.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                            title="Reject"
                          >
                            <XCircle size={16} className="text-white" />
                          </button>
                        </>
                      ) : e.status === "approved" ? (
                        <button
                          onClick={() => handleReject(e.id)}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors duration-200"
                          title="Revoke Approval"
                        >
                          <XCircle size={16} className="text-white" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="py-8 text-center text-gray-500 italic"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">📭</div>
                    <div>No enrollment records found</div>
                    <div className="text-xs text-gray-600">
                      Try adjusting your search or filter criteria
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
        <div>
          Showing <span className="text-green-400 font-medium">{filteredEnrollments.length}</span> of{" "}
          <span className="text-green-400 font-medium">{enrollments.length}</span> enrollments
        </div>
        <div className="text-xs">
          Pending: {enrollments.filter(e => e.status === 'pending').length} • 
          Approved: {enrollments.filter(e => e.status === 'approved').length} • 
          Rejected: {enrollments.filter(e => e.status === 'rejected').length}
        </div>
      </div>
    </div>
  );
};

export default EnrollmentManagement;