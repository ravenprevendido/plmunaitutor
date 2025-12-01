"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  PlusCircle,
  Edit,
  Trash2,
  BookOpen,
  CheckCircle,
  X,
  RefreshCw
} from "lucide-react";

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = ["Programming", "Technology", "Mathematics", "Science", "Business", "Web Development", "Data Science", "Cloud Computing"];

  useEffect(() => {
    fetchCourses();
    
    const handleCourseUpdate = () => {
      console.log("🔄 Course update detected - refreshing...");
      fetchCourses();
    };

    window.addEventListener('courseUpdated', handleCourseUpdate);
    return () => window.removeEventListener('courseUpdated', handleCourseUpdate);
  }, []);

  const fetchCourses = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
        console.log(`✅ Loaded ${data.length} courses`);
      } else {
        console.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.category) {
      return alert("Please fill all required fields.");
    }

    try {
      const slug = newCourse.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      
      const courseData = {
        title: newCourse.title,
        description: newCourse.description,
        category: newCourse.category,
        slug: slug
      };

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });
      
      if (response.ok) {
        const createdCourse = await response.json();
        
        setCourses(prev => [...prev, createdCourse]);
        setShowAddModal(false);
        setNewCourse({ title: "", description: "", category: "" });
        
        window.dispatchEvent(new CustomEvent('courseUpdated', { 
          detail: { action: 'created', course: createdCourse } 
        }));
        
        console.log("✅ Course created and notifications sent");
        alert('Course created successfully! 🎉');
      } else {
        alert('Failed to create course');
      }
    } catch (error) {
      console.error('Failed to create course:', error);
      alert('Error creating course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setShowEditModal(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse.title || !editingCourse.category) {
      return alert("Please fill all required fields.");
    }
    
    try {
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCourse)
      });

      if (response.ok) {
        const updatedCourse = await response.json();
        setCourses(courses.map(course => course.id === updatedCourse.id ? updatedCourse : course));
        setShowEditModal(false);
        setEditingCourse(null);
        
        window.dispatchEvent(new CustomEvent('courseUpdated', { 
          detail: { action: 'updated', course: updatedCourse } 
        }));
        
        alert('Course updated successfully! ✅');
      }
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };

  const handleArchive = async (id) => {
    if (confirm("Are you sure you want to archive this course?")) {
      try {
        const response = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setCourses(courses.filter((c) => c.id !== id));
          
          window.dispatchEvent(new CustomEvent('courseUpdated', { 
            detail: { action: 'deleted', courseId: id } 
          }));
          
          alert('Course archived successfully! 🗑️');
        }
      } catch (error) {
        console.error('Failed to archive course:', error);
      }
    }
  };

  const handleRefresh = () => {
    fetchCourses();
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6">
        <div className="text-center py-12">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-green-500">Course Management</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#161b22] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-full md:w-64"
            />
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle size={16} /> Add Course
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-400">
        Showing {filteredCourses.length} of {courses.length} courses
      </div>

      <div className="overflow-x-auto bg-[#161b22] border border-gray-800 rounded-lg">
        <table className="w-full text-sm text-gray-300">
          <thead className="bg-[#1c2128] text-gray-400 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 text-left">Course Title</th>
              <th className="py-3 px-4 text-left">Description</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <tr key={course.id} className="border-b border-gray-800 hover:bg-[#1c2128] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-green-500" />
                      <div className="font-medium">{course.title}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs text-gray-400 max-w-xs truncate">
                      {course.description || "No description"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-gray-800 px-2 py-1 rounded text-xs">{course.category}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.status === "active" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                    }`}>
                      <CheckCircle size={12} className="mr-1" />
                      {course.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleEdit(course)} className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors">
                        <Edit size={16} className="text-blue-400" />
                      </button>
                      <button onClick={() => handleArchive(course.id)} className="p-1.5 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500 italic">
                  <BookOpen size={32} className="mx-auto mb-2 text-gray-600" />
                  No courses found. {searchTerm && "Try a different search term."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Course Modal - WALANG TEACHER ASSIGNMENT */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] p-6 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-500">Add New Course</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  placeholder="Enter course title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  placeholder="Enter course description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  rows="3"
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                <select
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={handleAddCourse} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm">
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal - WALANG TEACHER ASSIGNMENT */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] p-6 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-500">Edit Course</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Course Title *</label>
                <input
                  type="text"
                  value={editingCourse.title}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows="3"
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                <select
                  value={editingCourse.category}
                  onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                  className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={handleUpdateCourse} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm">
                Update Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;