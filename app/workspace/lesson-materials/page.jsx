"use client";

import LessonMaterials from "../_components/LessonMaterials";

export default function () {
  return(
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto bg-white dark:bg-[#0D1117] min-h-screen">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        All Lesson Materials
      </h1>
      <LessonMaterials/>
    </div>
  )
}
