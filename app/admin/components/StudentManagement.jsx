"use client";
import React, { useState, useEffect } from 'react';
import { User, Mail, BookOpen, TrendingUp, X, CheckCircle2, Clock } from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        console.error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed progress for a student
  const fetchStudentProgress = async (studentId) => {
    try {
      setLoadingProgress(true);
      const response = await fetch(`/api/admin/students/${studentId}/progress`);
      if (response.ok) {
        const data = await response.json();
        setStudentProgress(data);
      } else {
        console.error('Failed to fetch student progress');
      }
    } catch (error) {
      console.error('Error fetching student progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Filter students based on search and status
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const viewProgress = async (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    await fetchStudentProgress(student.id);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setStudentProgress(null);
  };

  const deactivateStudent = async (studentId) => {
    if (confirm('Are you sure you want to deactivate this student?')) {
      // TODO: Implement deactivation API call
      setStudents(students.map(student =>
        student.id === studentId ? { ...student, status: 'deactivated' } : student
      ));
    }
  };

  // Generate avatar from email (using initials)
  const getAvatar = (name, email) => {
    if (name) {
      const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return initials;
    }
    return email?.[0]?.toUpperCase() || '?';
  };

  // Get avatar color based on email
  const getAvatarColor = (email) => {
    const colors = [
      'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
    ];
    const index = email?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-green-500 mb-2">
            Student Management
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Monitor student progress, courses, and enrollment activity.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search student name or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
          />
          <select
            value={filterStatus}
            onChange={handleFilterChange}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base"
          >
            <option value="all">All Students</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Enrolled Courses
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-750 transition-colors duration-150">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                      {student.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {student.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      {student.enrolledCourses || 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center gap-3">
                        <div className="w-24 md:w-32 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${student.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{student.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === 'active'
                            ? 'bg-green-900 text-green-200'
                            : 'bg-red-900 text-red-200'
                        }`}
                      >
                        {student.status === 'active' ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => viewProgress(student)}
                          className="text-green-400 hover:text-green-300 transition-colors duration-200 text-xs md:text-sm px-2 py-1 rounded border border-green-400 hover:border-green-300"
                        >
                          View Progress
                        </button>
                        {student.status === 'active' && (
                          <button
                            onClick={() => deactivateStudent(student.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-200 text-xs md:text-sm px-2 py-1 rounded border border-red-400 hover:border-red-300"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            No students found matching your criteria.
          </div>
        )}
      </div>

      {/* Enhanced Progress Modal */}
      {isModalOpen && selectedStudent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div 
            className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-green-500">Student Progress Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingProgress ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading progress...</p>
                  </div>
                </div>
              ) : studentProgress ? (
                <>
                  {/* Student Info Card */}
                  <div className="bg-gray-750 rounded-lg p-6 mb-6 border border-gray-700">
                    <div className="flex items-center gap-6">
                      {/* Avatar */}
                      <div className={`${getAvatarColor(selectedStudent.email)} w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
                        {getAvatar(selectedStudent.name, selectedStudent.email)}
                      </div>
                      
                      {/* Student Details */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{studentProgress.student.name}</h3>
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Mail className="w-4 h-4" />
                          <span>{studentProgress.student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <BookOpen className="w-4 h-4" />
                          <span>{studentProgress.enrolled_courses} Enrolled Course{studentProgress.enrolled_courses !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Overall Progress */}
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-500 mb-1">
                          {studentProgress.overall_progress}%
                        </div>
                        <div className="text-sm text-gray-400">Overall Progress</div>
                        <div className="w-32 bg-gray-700 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${studentProgress.overall_progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Courses List */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Course Progress
                    </h4>
                    
                    {studentProgress.courses && studentProgress.courses.length > 0 ? (
                      studentProgress.courses.map((course, index) => (
                        <div key={course.course_id || index} className="bg-gray-750 rounded-lg p-5 border border-gray-700 hover:border-green-500 transition-colors">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h5 className="text-lg font-semibold text-white mb-1">{course.course_title}</h5>
                              <p className="text-sm text-gray-400">Course ID: {course.course_id}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-500">{course.progress}%</div>
                              <div className="text-xs text-gray-400">Complete</div>
                            </div>
                          </div>

                          {/* Overall Progress Bar */}
                          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                            <div
                              className="bg-green-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>

                          {/* Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            {/* Lessons */}
                            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Lessons</span>
                                <span className="text-xs font-semibold text-green-400">
                                  {course.lessons.completed}/{course.lessons.total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${course.lessons.progress}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{course.lessons.progress}%</div>
                            </div>

                            {/* Quizzes */}
                            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Quizzes</span>
                                <span className="text-xs font-semibold text-green-400">
                                  {course.quizzes.completed}/{course.quizzes.total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${course.quizzes.progress}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{course.quizzes.progress}%</div>
                            </div>

                            {/* Assignments */}
                            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Assignments</span>
                                <span className="text-xs font-semibold text-green-400">
                                  {course.assignments.completed}/{course.assignments.total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-yellow-500 h-2 rounded-full"
                                  style={{ width: `${course.assignments.progress}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{course.assignments.progress}%</div>
                            </div>
                          </div>

                          {/* Last Accessed */}
                          {course.last_accessed && (
                            <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last accessed: {new Date(course.last_accessed).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No enrolled courses found.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Failed to load student progress.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6">
              <button
                onClick={closeModal}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
