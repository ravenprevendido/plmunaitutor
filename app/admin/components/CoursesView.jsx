// components/admin/CoursesView.jsx
const CoursesView = () => {
  const courses = [
    { id: 1, name: "Python Programming", students: 150, progress: 85 },
    { id: 2, name: "React Development", students: 120, progress: 70 },
    { id: 3, name: "AI Fundamentals", students: 200, progress: 90 },
    { id: 4, name: "Java Basics", students: 80, progress: 60 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-[#161b22] p-6 rounded-xl border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-2">{course.name}</h3>
            <p className="text-gray-400 text-sm">Students: {course.students}</p>
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{course.progress}% Complete</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesView;