"use client";
import React, { useState } from "react";
import { Pencil, Eye, X } from "lucide-react";

const studyPlans = [
  {
    name: "Juan Dela Cruz",
    course: "Python Programming",
    status: "Active",
    progress: 75,
    suggestion: "Focus on 'Functions' and 'Object-Oriented Programming' drills.",
    color: "bg-green-800 text-green-100",
    profile: {
      title: "Advanced Python Programming",
      progress: 75,
      weeks: [
        {
          week: "Week 1",
          title: "Introduction to Python Basics",
          tasks: "Review syntax, complete variable assignment exercises.",
          lessons: "Lesson 1: Python Fundamentals, Lesson 2: Data Types",
          quiz: "Quiz 1: Basic Syntax",
          due: "2024-03-10",
          status: "Completed",
        },
        {
          week: "Week 2",
          title: "Control Flow and Functions",
          tasks: "Implement conditional statements, write custom functions.",
          lessons: "Lesson 3: If/Else Statements, Lesson 4: Function Definitions",
          quiz: "Quiz 2: Control Flow",
          due: "2024-03-17",
          status: "Active",
        },
        {
          week: "Week 3",
          title: "Data Structures: Lists and Tuples",
          tasks: "Practice list manipulations, understand tuple immutability.",
          lessons: "Lesson 5: Lists, Lesson 6: Tuples",
          quiz: "Quiz 3: Lists and Tuples",
          due: "2024-03-24",
          status: "Upcoming",
        },
      ],
    },
  },
  {
    name: "Maria Santos",
    course: "Data Structures & Algorithms",
    status: "Delayed",
    progress: 45,
    suggestion: "Review 'Arrays' and 'Linked Lists', consider practice problems.",
    color: "bg-yellow-800 text-yellow-100",
  },
  {
    name: "Alex Tan",
    course: "Web Development Fundamentals",
    status: "Completed",
    progress: 100,
    suggestion:
      "Start next module on 'Frontend Frameworks' or 'Backend Integration'.",
    color: "bg-blue-800 text-blue-100",
  },
];

const Page = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-gray-100 flex flex-col lg:flex-row gap-6">
      {/* Student Study Plans Section */}
      <div className="flex-1 bg-gray-800 shadow-lg rounded-2xl p-5">
        <h2 className="text-xl font-semibold mb-1">Student Study Plans</h2>
        <p className="text-sm text-gray-400 mb-4">
          Overview of all active and pending study plans.
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-700/50 text-left text-gray-300">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Plan Status</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">AI Suggestion</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {studyPlans.map((plan, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{plan.name}</td>
                  <td className="py-3 px-4">{plan.course}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${plan.color}`}
                    >
                      {plan.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{plan.progress}%</td>
                  <td className="py-3 px-4 text-gray-300">
                    {plan.suggestion}
                  </td>
                  <td className="py-3 px-4 flex justify-center gap-2">
                    <button className="text-blue-400 hover:text-blue-300">
                      <Pencil size={16} />
                    </button>
                    <button
                      className="text-gray-400 hover:text-white"
                      onClick={() => setSelectedStudent(plan)}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="w-full lg:w-1/3 bg-gray-800 shadow-lg rounded-2xl p-5 h-fit">
        <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2 mb-2">
          💡 AI Insights
        </h3>
        <p className="font-semibold mb-2 text-gray-200">
          Gemini AI Tutor suggests:
        </p>
        <ul className="text-sm text-gray-400 list-disc list-inside space-y-2 mb-4">
          <li>Focus on problem-solving drills for 'Functions' in Python.</li>
          <li>Review advanced sorting algorithms, particularly QuickSort.</li>
          <li>Dedicate 30 minutes daily to practice SQL queries.</li>
          <li>Explore new learning resources on data visualization.</li>
        </ul>

        <div className="flex flex-col gap-3">
          <button className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition">
            Apply Suggestion
          </button>
          <button className="border border-green-500 text-green-400 hover:bg-green-900/40 py-2 rounded-lg font-medium transition">
            Chat with AI Tutor
          </button>
        </div>
      </div>

      {/* Modal Popup */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-4xl shadow-lg overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">
                Student Study Plan: {selectedStudent.name}
              </h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row p-6 gap-6">
              {/* Left Profile */}
              <div className="lg:w-1/4 text-center border-r border-gray-700">
                <img
                  src="https://via.placeholder.com/100"
                  alt="profile"
                  className="w-24 h-24 rounded-full mx-auto mb-3"
                />
                <h3 className="font-semibold text-white">
                  {selectedStudent.name}
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  {selectedStudent.profile?.title || selectedStudent.course}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${selectedStudent.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">
                  {selectedStudent.progress}% Completed
                </p>
              </div>

              {/* Middle Study Timeline */}
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-3">
                  Study Plan Timeline
                </h4>
                <div className="space-y-4">
                  {selectedStudent.profile?.weeks.map((w, i) => (
                    <div
                      key={i}
                      className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700/60 transition"
                    >
                      <h5 className="font-semibold text-green-400">
                        {w.week}: {w.title}
                      </h5>
                      <p className="text-sm mt-2 text-gray-300">
                        <strong>Tasks:</strong> {w.tasks}
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Lessons:</strong> {w.lessons}
                      </p>
                      <p className="text-sm text-gray-300">
                        <strong>Quiz:</strong> {w.quiz}
                      </p>
                      <p className="text-sm text-gray-400">
                        <strong>Due Date:</strong> {w.due}
                      </p>
                      <p className="text-sm mt-1">
                        <strong>Status:</strong>{" "}
                        <span
                          className={`${
                            w.status === "Completed"
                              ? "text-green-400"
                              : w.status === "Active"
                              ? "text-blue-400"
                              : "text-gray-400"
                          }`}
                        >
                          {w.status}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right AI Insights */}
              <div className="lg:w-1/3 bg-gray-700 border border-gray-600 rounded-xl p-4 h-fit">
                <h4 className="font-semibold text-green-400 mb-2">
                  All Insights for {selectedStudent.name}
                </h4>
                <p className="text-sm text-gray-300 mb-2 font-semibold">
                  Recommended Activities:
                </p>
                <ul className="text-sm text-gray-400 list-disc list-inside space-y-1 mb-3">
                  <li>Complete additional practice problems on functions.</li>
                  <li>Review advanced concepts of list comprehensions.</li>
                  <li>Engage in peer-to-peer coding challenges.</li>
                </ul>
                <p className="text-sm text-gray-300">
                  <strong>Predicted Performance:</strong> Excellent grade
                  expected with consistent study habits.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Generate Plan with AI
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Save Changes
              </button>
              <button className="border border-gray-500 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-700">
                Export Plan (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
