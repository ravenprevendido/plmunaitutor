// app/workspace/my-courses/[courseId]/quiz/[quizId]/page.jsx
"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function QuizPage() {
  const { courseId, quizId } = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("🎯 Quiz Page Mounted", {
    courseId,
    quizId,
    userLoaded: isLoaded,
    user: user?.id,
    path: `/workspace/my-courses/${courseId}/quiz/${quizId}`
  });

  // Wait for user to load before doing anything
  useEffect(() => {
    if (isLoaded) {
      if (user) {
        console.log("✅ User authenticated, fetching quiz data...");
        fetchQuizData();
      } else {
        console.log("❌ No user found, this should not happen with middleware protection");
        // If middleware is working, this should never happen
        router.push("/sign-in");
      }
    }
  }, [isLoaded, user, courseId, quizId]);

// In your quiz page, update the progress check section:
const fetchQuizData = async () => {
  try {
    setLoading(true);
    console.log("📝 Fetching quiz from API...");
    
    const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`);
    console.log("📡 API Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error response:", errorText);
      throw new Error(`Failed to fetch quiz: ${response.status}`);
    }
    
    const quizData = await response.json();
    console.log("✅ Quiz data loaded:", quizData);
    
    if (!quizData || !quizData.questions) {
      throw new Error("Invalid quiz data received");
    }
    
    setQuiz(quizData);

    // Check if student has already taken this quiz
    try {
      const progressResponse = await fetch(`/api/courses/${courseId}/progress`);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        console.log("📊 Progress data:", progressData);
        
        // Use completedQuizzes array instead of quizzesCompleted number
        const isCompleted = Array.isArray(progressData.completedQuizzes) && 
                          progressData.completedQuizzes.includes(parseInt(quizId));
        
        if (isCompleted) {
          console.log("✅ Quiz already completed");
          setQuizCompleted(true);
        }
      }
    } catch (progressError) {
      console.log("⚠️ Could not check progress:", progressError);
    }

  } catch (error) {
    console.error('❌ Error fetching quiz:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

  // Rest of your functions remain the same...
  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      // Calculate score
      let score = 0;
      quiz.questions.forEach((question, index) => {
        if (answers[index] === question.correctAnswer) {
          score++;
        }
      });

      const finalScore = Math.round((score / quiz.questions.length) * 100);

      console.log("📊 Submitting quiz results:", {
        course_id: parseInt(courseId),
        quiz_id: parseInt(quizId),
        score: finalScore
      });

      // Submit quiz results
      const response = await fetch('/api/student-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: parseInt(courseId),
          quiz_id: parseInt(quizId),
          completed: true,
          score: finalScore,
          answers: answers
        })
      });

      if (response.ok) {
        console.log("✅ Quiz submitted successfully");
        setQuizCompleted(true);
        
        // Show success message
        alert(`Quiz submitted! Your score: ${finalScore}%`);
        
        // Redirect to quizzes-assessment page to see all quizzes
        router.push(`/workspace/quizzes-assessment`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quiz');
      }

    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    }
  };

  // Show loading while user is being loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Show error if no user (shouldn't happen with middleware)
  if (isLoaded && !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-500 text-center">
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p>Please log in to access this quiz.</p>
          <Link 
            href="/sign-in"
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Rest of your loading/error states...
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 text-red-600 dark:text-red-500">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-2">Error Loading Quiz</h2>
          <p>{error}</p>
          <button 
            onClick={fetchQuizData}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
          <Link 
            href={`/workspace/my-courses/${courseId}?tab=quizzes`}
            className="ml-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 text-red-600 dark:text-red-500">
        <div className="max-w-4xl mx-auto">
          <p>Quiz not found. Please check if the quiz exists and you have access to it.</p>
          <Link 
            href={`/workspace/my-courses/${courseId}?tab=quizzes`}
            className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded inline-block"
          >
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle size={64} className="text-green-600 dark:text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Quiz Completed!</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            You have already completed this quiz.
          </p>
          <Link 
            href={`/workspace/my-courses/${courseId}?tab=quizzes`}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Quizzes
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto">
        {/* Debug Info - Remove in production */}
        <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded text-sm text-gray-900 dark:text-white">
          <p><strong>Debug Info:</strong> User: {user?.fullName} | Quiz: {quizId} | Course: {courseId}</p>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={`/workspace/my-courses/${courseId}?tab=quizzes`}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Course
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </div>
            {timeRemaining && (
              <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <Clock size={16} />
                <span>{timeRemaining}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">{quiz.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{quiz.questions?.length || 0} questions</span>
            {quiz.deadline && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>Due: {new Date(quiz.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Current Question */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {currentQuestion + 1}. {currentQ.question}
          </h2>
          
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  answers[currentQuestion] === index
                    ? 'border-green-500 bg-green-50 dark:bg-green-500/20 text-gray-900 dark:text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded border flex items-center justify-center text-sm ${
                    answers[currentQuestion] === index
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-400 dark:border-gray-500'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className={`px-6 py-2 rounded-lg transition-colors ${
              currentQuestion === 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white'
            }`}
          >
            Previous
          </button>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Next Question
            </button>
          )}
        </div>

        {/* Quiz Progress Overview */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quiz Progress</h3>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`h-10 rounded border transition-colors ${
                  answers[index] !== undefined
                    ? 'border-green-500 bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                } ${
                  currentQuestion === index
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}