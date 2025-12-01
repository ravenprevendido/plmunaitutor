// app/workspace/quiz-results/[quizId]/page.jsx
"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Home, BarChart3, Calendar } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function QuizResultsPage() {
  const { quizId } = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [quizData, setQuizData] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchQuizResults();
    }
  }, [isLoaded, user, quizId]);

const fetchQuizResults = async () => {
  try {
    setLoading(true);
    setError(null);
    console.log("📊 Fetching quiz results for quiz:", quizId);

    // Use single API call that returns both quiz data and progress
    const response = await fetch(`/api/student/${quizId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch quiz data');
    }

    const data = await response.json();
    
    console.log("✅ API Response:", data);

    if (!data.quiz || !data.progress) {
      throw new Error('Incomplete data received from server');
    }

    setQuizData(data.quiz);
    setStudentAnswers(data.progress);

  } catch (error) {
    console.error('❌ Error fetching quiz results:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};


// Add this debug effect
useEffect(() => {
  console.log("🔍 DEBUG - Current State:", {
    quizData,
    studentAnswers,
    hasQuizData: !!quizData,
    hasStudentAnswers: !!studentAnswers,
    studentAnswersData: studentAnswers,
    quizQuestions: quizData?.questions
  });
  
  if (quizData && studentAnswers) {
    console.log("📊 Calculating actual score...");
    const { score, total, percentage } = calculateScore();
    console.log("🎯 Calculated Score:", { score, total, percentage });
    
    // Check each question
    quizData.questions.forEach((question, index) => {
      const studentAnswer = studentAnswers.answers?.[index];
      const correctAnswer = question.correctAnswer;
      const isCorrect = studentAnswer === correctAnswer;
      
      console.log(`❓ Question ${index + 1}:`, {
        studentAnswer,
        correctAnswer,
        isCorrect,
        studentAnswerText: studentAnswer !== undefined ? question.options[studentAnswer] : 'No answer',
        correctAnswerText: question.options[correctAnswer]
      });
    });
  }
}, [quizData, studentAnswers]);


 const calculateScore = () => {
  if (!quizData || !studentAnswers) return { score: 0, total: 0, percentage: 0 };

  console.log("🎯 Calculating score from:", {
    studentAnswers: studentAnswers.answers,
    questions: quizData.questions
  });

  let correct = 0;
  const total = quizData.questions.length;

  // Check each question
  quizData.questions.forEach((question, index) => {
    const studentAnswer = studentAnswers.answers?.[index];
    console.log(`Question ${index}: studentAnswer=${studentAnswer}, correctAnswer=${question.correctAnswer}`);
    
    if (studentAnswer !== undefined && studentAnswer === question.correctAnswer) {
      correct++;
      console.log(`✅ Question ${index} CORRECT`);
    } else {
      console.log(`❌ Question ${index} INCORRECT or no answer`);
    }
  });

  const percentage = Math.round((correct / total) * 100);
  
  console.log("📊 Final Score Calculation:", {
    correct,
    total, 
    percentage,
    dbScore: studentAnswers.score // Also show the score from database
  });
  
  // Use database score if available, otherwise use calculated score
  const finalPercentage = studentAnswers.score !== null ? studentAnswers.score : percentage;
  const finalScore = studentAnswers.score !== null ? Math.round((studentAnswers.score / 100) * total) : correct;

  return { 
    score: finalScore, 
    total, 
    percentage: finalPercentage 
  };
};



  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (percentage) => {
    if (percentage >= 90) return { text: 'Excellent!', color: 'bg-green-500' };
    if (percentage >= 80) return { text: 'Great Job!', color: 'bg-green-600' };
    if (percentage >= 70) return { text: 'Good Work', color: 'bg-blue-500' };
    if (percentage >= 60) return { text: 'Passed', color: 'bg-yellow-500' };
    return { text: 'Needs Improvement', color: 'bg-red-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] p-6 text-gray-900 dark:text-white">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="bg-gray-50 dark:bg-[#161b22] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((o) => (
                        <div key={o} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 dark:bg-[#161b22] rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-64"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] p-6 text-gray-900 dark:text-white">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle size={64} className="text-red-600 dark:text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Error Loading Results</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={fetchQuizResults}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              Try Again
            </button>
            <Link
              href="/workspace"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Home size={16} />
              Back to Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

if (error || !quizData || !studentAnswers) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] p-6 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto text-center">
        <AlertCircle size={64} className="text-yellow-600 dark:text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          {error ? 'Error Loading Results' : 'Quiz Results Not Found'}
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {error || 'The quiz results you\'re looking for don\'t exist or you don\'t have access to them.'}
        </p>
        
        {/* Debug Information */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold mb-2">Debug Information:</h3>
          <div className="text-sm space-y-1">
            <p>Quiz Data: {quizData ? '✅ Loaded' : '❌ Missing'}</p>
            <p>Student Answers: {studentAnswers ? '✅ Loaded' : '❌ Missing'}</p>
            <p>Quiz ID: {quizId}</p>
            <p>Error: {error || 'None'}</p>
            {studentAnswers && (
              <>
                <p>Score from DB: {studentAnswers.score}</p>
                <p>Completed: {studentAnswers.completed ? 'Yes' : 'No'}</p>
                <p>Answers: {JSON.stringify(studentAnswers.answers)}</p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={fetchQuizResults}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
          <Link
            href="/workspace/quizzes-assessment"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Quizzes
          </Link>
          <Link
            href={`/workspace/my-courses/${quizData?.courseId || 1}/quiz/${quizId}`}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg"
          >
            Take Quiz First
          </Link>
        </div>
      </div>
    </div>
  );
}

  const { score, total, percentage } = calculateScore();
  const scoreBadge = getScoreBadge(percentage);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] p-6 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <Link 
              href="/workspace"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
            >
              <ArrowLeft size={20} />
              Back to Workspace
            </Link>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Quiz Results</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{quizData.title}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${scoreBadge.color}`}>
              {scoreBadge.text}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Questions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz Info */}
            <div className="bg-white dark:bg-[#161b22] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Quiz Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{score}/{total}</div>
                  <div className="text-sm text-gray-400">Questions</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>{percentage}%</div>
                  <div className="text-sm text-gray-400">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round((score / total) * 100)}%
                  </div>
                  <div className="text-sm text-gray-400">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {quizData.timeSpent}
                  </div>
                  <div className="text-sm text-gray-400">Time</div>
                </div>
              </div>
            </div>

            {/* Questions Review */}
            <div className="bg-white dark:bg-[#161b22] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Question Review</h2>
              <div className="space-y-6">
                {quizData.questions.map((question, index) => {
                  const studentAnswer = studentAnswers?.answers?.[index];
                  const isCorrect = studentAnswer === question.correctAnswer;
                  
                  return (
                    <div key={index} className="border-b border-gray-700 pb-6 last:border-b-0">
                      <div className="flex items-start gap-3 mb-4">
                        {isCorrect ? (
                          <CheckCircle size={24} className="text-green-500 mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle size={24} className="text-red-500 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-medium mb-3">
                            {index + 1}. {question.question}
                          </h3>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => {
                              let optionStyle = "p-3 rounded-lg border transition-colors ";
                              
                              if (optionIndex === question.correctAnswer) {
                                optionStyle += "border-green-500 bg-green-500/20 text-green-300";
                              } else if (optionIndex === studentAnswer && !isCorrect) {
                                optionStyle += "border-red-500 bg-red-500/20 text-red-300";
                              } else {
                                optionStyle += "border-gray-600 text-gray-300";
                              }

                              return (
                                <div key={optionIndex} className={optionStyle}>
                                  <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded border flex items-center justify-center text-sm ${
                                      optionIndex === question.correctAnswer
                                        ? 'border-green-500 bg-green-500 text-white'
                                        : optionIndex === studentAnswer && !isCorrect
                                        ? 'border-red-500 bg-red-500 text-white'
                                        : 'border-gray-500'
                                    }`}>
                                      {String.fromCharCode(65 + optionIndex)}
                                    </span>
                                    <span>{option}</span>
                                    {optionIndex === question.correctAnswer && (
                                      <CheckCircle size={16} className="text-green-500 ml-auto" />
                                    )}
                                    {optionIndex === studentAnswer && !isCorrect && (
                                      <XCircle size={16} className="text-red-500 ml-auto" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {!isCorrect && studentAnswer !== undefined && (
                            <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500 rounded-lg">
                              <p className="text-blue-300 text-sm">
                                <strong>Your answer:</strong> {String.fromCharCode(65 + studentAnswer)} - {question.options[studentAnswer]}
                              </p>
                              <p className="text-green-300 text-sm mt-1">
                                <strong>Correct answer:</strong> {String.fromCharCode(65 + question.correctAnswer)} - {question.options[question.correctAnswer]}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white dark:bg-[#161b22] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-green-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{percentage}%</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Overall Score</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  You answered {score} out of {total} questions correctly
                </p>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${scoreBadge.color} inline-block`}>
                  {scoreBadge.text}
                </div>
              </div>
            </div>

            {/* Quiz Details */}
            <div className="bg-white dark:bg-[#161b22] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quiz Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Course:</span>
                  <span className="text-gray-900 dark:text-white">{quizData.course}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                  <span className="text-gray-900 dark:text-white">{studentAnswers?.submitted_at ? new Date(studentAnswers.submitted_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time Taken:</span>
                  <span className="text-gray-900 dark:text-white">{quizData.timeSpent || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                  <span className="capitalize text-gray-900 dark:text-white">{quizData.difficulty || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-[#161b22] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                >
                  Print Results
                </button>
                <Link
                  href={`/workspace/my-courses/${quizData.courseId}?tab=quizzes`}
                  className="block w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-2 rounded-lg transition-colors text-center"
                >
                  Back to Quizzes
                </Link>
                <Link
                  href="/workspace"
                  className="block w-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 py-2 rounded-lg transition-colors text-center"
                >
                  Back to Workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}