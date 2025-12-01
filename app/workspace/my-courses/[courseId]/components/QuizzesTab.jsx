// app/workspace/my-courses/[courseId]/components/QuizzesTab.jsx
"use client";
import { useState, useEffect } from "react";
import { Clock, FileText, CheckCircle, XCircle, Play, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuizzesTab({ quizzes, courseId }) {
  const [studentQuizzes, setStudentQuizzes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchQuizProgress = async () => {
      try {
        const progressResponse = await fetch(`/api/courses/${courseId}/progress`);
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          console.log("📊 Progress data:", progressData);
          
          const enhancedQuizzes = quizzes.map(quiz => {
            // Check if this quiz is completed - use completedQuizzes array
            const isCompleted = Array.isArray(progressData.completedQuizzes) && 
                              progressData.completedQuizzes.includes(quiz.id);
            const isOverdue = quiz.deadline && new Date(quiz.deadline) < new Date();
            
            console.log(`📝 Quiz ${quiz.id} completed:`, isCompleted);
            
            return {
              ...quiz,
              status: getQuizStatus(isCompleted, isOverdue),
              dueDate: quiz.deadline ? new Date(quiz.deadline) : null,
              isOverdue,
              timeRemaining: quiz.deadline ? getTimeRemaining(quiz.deadline) : null,
              isCompleted
            };
          });
          
          setStudentQuizzes(enhancedQuizzes);
        }
      } catch (error) {
        console.error('Error fetching quiz progress:', error);
        // Fallback: set quizzes without progress data
        setStudentQuizzes(quizzes.map(quiz => ({
          ...quiz,
          status: "Not Taken",
          dueDate: quiz.deadline ? new Date(quiz.deadline) : null,
          isOverdue: quiz.deadline && new Date(quiz.deadline) < new Date(),
          timeRemaining: quiz.deadline ? getTimeRemaining(quiz.deadline) : null,
          isCompleted: false
        })));
      }
    };

    if (quizzes.length > 0) {
      fetchQuizProgress();
    } else {
      setStudentQuizzes([]);
    }
  }, [quizzes, courseId]);

  const getQuizStatus = (isCompleted, isOverdue) => {
    if (isOverdue && !isCompleted) return "Missed";
    if (isCompleted) return "Completed";
    return "Not Taken";
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const due = new Date(deadline);
    const diff = due - now;
    
    if (diff <= 0) return "Overdue";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const takeQuiz = (quizId) => {
    console.log("🎯 Taking quiz:", quizId, "in course:", courseId);
    // Use router.push for client-side navigation
    router.push(`/workspace/my-courses/${courseId}/quiz/${quizId}`);
  };

  const getStatusIcon = (status, isOverdue) => {
    if (isOverdue) return <AlertCircle size={16} className="text-red-500" />;
    
    switch (status) {
      case "Completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "Not Taken":
        return <FileText size={16} className="text-gray-500" />;
      case "Missed":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <FileText size={16} className="text-blue-500" />;
    }
  };

  const getStatusColor = (status, isOverdue) => {
    if (isOverdue) return "text-red-400";
    
    switch (status) {
      case "Completed": return "text-green-400";
      case "Not Taken": return "text-gray-400";
      case "Missed": return "text-red-400";
      default: return "text-blue-400";
    }
  };

  return (
    <div className="space-y-4">
      {studentQuizzes.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No quizzes available yet</p>
          <p className="text-sm mt-2">Your teacher hasn't created any quizzes for this course.</p>
        </div>
      ) : (
        studentQuizzes.map((quiz) => (
          <div key={quiz.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{quiz.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(quiz.status, quiz.isOverdue)}
                    <span className={getStatusColor(quiz.status, quiz.isOverdue)}>
                      {quiz.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <FileText size={14} />
                    <span>{quiz.questions?.length || 0} questions</span>
                  </div>
                  
                  {quiz.dueDate && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} className={quiz.isOverdue ? "text-red-400" : "text-yellow-400"} />
                      <span className={quiz.isOverdue ? "text-red-400" : "text-yellow-400"}>
                        {quiz.isOverdue ? "Overdue" : `Due: ${quiz.dueDate.toLocaleDateString()}`}
                      </span>
                    </div>
                  )}
                  
                  {quiz.timeRemaining && !quiz.isOverdue && (
                    <div className="flex items-center gap-1">
                      <span className="text-orange-400">
                        {quiz.timeRemaining} remaining
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {quiz.status === "Not Taken" && (
                  <button
                    onClick={() => takeQuiz(quiz.id)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Play size={16} />
                    Take Quiz
                  </button>
                )}
                
                {quiz.status === "Completed" && (
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Completed
                  </span>
                )}
                
                {quiz.isOverdue && quiz.status === "Not Taken" && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Missed
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}