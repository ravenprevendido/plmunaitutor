import React from 'react'
import CourseList from '../_components/CourseList'

function MyCourses() {
  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-[#0D1117] min-h-screen">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-300">My Courses</h1>
        <p className="text-green-600 dark:text-green-300 mt-2 text-sm sm:text-base">Manage and track your learning progress</p>
      </div>
      <CourseList />
    </div>
  )
}
 
export default MyCourses



