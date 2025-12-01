"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, BookOpen, FileText, ChevronRight, Laptop, Book, Rocket, Video, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function PracticeLessonPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState(new Set());
  const [lessonProgress, setLessonProgress] = useState(null);
  const [lessonsProgress, setLessonsProgress] = useState({});
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    fetchLessonData();
  }, [courseId, lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData);
      }

      // Fetch all lessons for sidebar
      const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`);
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        setAllLessons(lessonsData);
        
        // Fetch progress for all lessons
        const progressPromises = lessonsData.map(async (l) => {
          try {
            const progressRes = await fetch(`/api/courses/${courseId}/lessons/${l.id}/progress`);
            if (progressRes.ok) {
              const progress = await progressRes.json();
              const questions = getAllQuestionsFromLesson(l);
              const totalQuestions = questions.length;
              const completed = progress.completed_exercises?.length || 0;
              return { 
                lessonId: l.id, 
                current: completed,
                total: totalQuestions,
                percentage: progress.completion_percentage || 0
              };
            }
          } catch (error) {
            console.error(`Error fetching progress for lesson ${l.id}:`, error);
          }
          return { lessonId: l.id, current: 0, total: 0, percentage: 0 };
        });
        
        const progressResults = await Promise.all(progressPromises);
        const progressMap = {};
        progressResults.forEach(({ lessonId, current, total, percentage }) => {
          progressMap[lessonId] = { current, total, percentage };
        });
        setLessonsProgress(progressMap);
      }

      // Fetch current lesson
      const lessonResponse = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
      if (lessonResponse.ok) {
        const lessonData = await lessonResponse.json();
        
        // Check if this is a practice lesson
        // Priority: video_url takes precedence
        if (lessonData.video_url && lessonData.video_url.trim() !== '') {
          // Has video, redirect to video lesson
          router.replace(`/workspace/my-courses/${courseId}/lesson/${lessonId}`);
          return;
        }
        
        // Check if it's explicitly a practice lesson
        if (lessonData.lesson_type === 'practice') {
          // It's a practice lesson, continue
          setLesson(lessonData);
        } else if (lessonData.exercises && lessonData.exercises.length > 0) {
          // Has exercises but not marked as practice - treat as practice anyway
          setLesson(lessonData);
        } else {
          // Not a practice lesson, redirect to text lesson
          router.replace(`/workspace/my-courses/${courseId}/text-lesson/${lessonId}`);
          return;
        }
      }

      // Fetch lesson progress
      await fetchLessonProgress();

    } catch (error) {
      console.error('Error fetching lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllQuestionsFromLesson = (lessonData) => {
    if (!lessonData || !lessonData.exercises) return [];
    const questions = [];
    lessonData.exercises.forEach((exercise) => {
      if (exercise.questions) {
        exercise.questions.forEach((q) => {
          questions.push(q);
        });
      }
    });
    return questions;
  };

  const getAllQuestions = () => {
    return getAllQuestionsFromLesson(lesson);
  };

  const fetchLessonProgress = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`);
      if (response.ok) {
        const progressData = await response.json();
        setLessonProgress(progressData);
        setCompletedQuestions(new Set(progressData.completed_exercises || []));
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const questions = getAllQuestions();
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const handleAnswerSelect = (answerIndex) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleNext = async () => {
    if (!currentQuestion) return;

    // Auto-check answer if not already shown
    if (!showResult) {
      const correctAnswer = currentQuestion.correct_answer || 0;
      const correct = selectedAnswer === correctAnswer;
      setIsCorrect(correct);
      setShowResult(true);
      
      // Mark question as completed
      setCompletedQuestions(prev => new Set([...prev, currentQuestionIndex]));
      
      // Update progress
      await updateProgress(currentQuestionIndex, correct);
      
      return;
    }

    // Move to next question
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      // All questions completed
      await completeLesson();
    }
  };

  const updateProgress = async (questionIndex, isCorrect) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          completed_exercise_id: questionIndex,
          is_correct: isCorrect 
        })
      });
      
      if (response.ok) {
        await fetchLessonProgress();
        // Refresh all lessons progress
        await fetchLessonData();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const completeLesson = async () => {
    try {
      await fetch(`/api/student-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: parseInt(courseId),
          lesson_id: parseInt(lessonId),
          completed: true
        })
      });
      
      await fetchLessonProgress();
      await fetchLessonData();
      
      alert('Congratulations! You completed all practice questions!');
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const getLessonIcon = (l) => {
    if (l.video_url) return <Laptop className="w-4 h-4" />;
    if (l.lesson_type === 'practice') return <Rocket className="w-4 h-4" />;
    return <Book className="w-4 h-4" />;
  };

  const getLessonRoute = (l) => {
    if (l.video_url) return `/workspace/my-courses/${courseId}/lesson/${l.id}`;
    if (l.lesson_type === 'practice') return `/workspace/my-courses/${courseId}/practice-lesson/${l.id}`;
    return `/workspace/my-courses/${courseId}/text-lesson/${l.id}`;
  };

  const getLessonProgressDisplay = (l) => {
    const progress = lessonsProgress[l.id];
    if (!progress) return null;
    
    // For practice lessons, show current/total (e.g., 2/5)
    if (l.lesson_type === 'practice' && progress.total > 0) {
      return `${progress.current}/${progress.total}`;
    }
    
    // For other lessons, show duration or percentage
    if (l.duration) {
      const minutes = Math.floor(l.duration);
      const seconds = Math.round((l.duration - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white p-6">
        <div className="text-red-600 dark:text-red-500">
          <h2 className="text-xl font-bold">Lesson Not Found</h2>
          <Link href={`/workspace/my-courses/${courseId}`} className="text-green-600 hover:underline mt-4 inline-block">
            ← Back to Course
          </Link>
        </div>
      </div>
    );
  }

  // Check if lesson has questions
  if (totalQuestions === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white p-6">
        <div className="text-yellow-600 dark:text-yellow-500">
          <h2 className="text-xl font-bold">No Questions Available</h2>
          <p className="mt-2">This practice lesson doesn't have any questions yet. Please contact your teacher.</p>
          <Link href={`/workspace/my-courses/${courseId}`} className="text-green-600 hover:underline mt-4 inline-block">
            ← Back to Course
          </Link>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white p-6">
        <div className="text-yellow-600 dark:text-yellow-500">
          <h2 className="text-xl font-bold">Question Not Found</h2>
          <p className="mt-2">Unable to load the current question.</p>
          <Link href={`/workspace/my-courses/${courseId}`} className="text-green-600 hover:underline mt-4 inline-block">
            ← Back to Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117]">
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Practice Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              {/* Practice Header */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">LET'S PRACTICE!</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {lesson.title}
                </h1>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {Array.from({ length: Math.min(5, totalQuestions) }).map((_, index) => {
                  const stepNumber = index + 1;
                  const isActive = currentQuestionIndex + 1 === stepNumber;
                  const isCompleted = completedQuestions.has(index) || currentQuestionIndex > index;
                  
                  return (
                    <div
                      key={index}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white scale-110'
                          : isCompleted
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {stepNumber}
                    </div>
                  );
                })}
                {totalQuestions > 5 && (
                  <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">
                    ...{totalQuestions}
                  </span>
                )}
              </div>

              {/* Question Content */}
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-[#1a1f29] rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                    {currentQuestion.question}
                  </h2>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, optIndex) => {
                      const isSelected = selectedAnswer === optIndex;
                      const showCorrect = showResult && optIndex === (currentQuestion.correct_answer || 0);
                      const showIncorrect = showResult && isSelected && !isCorrect;

                      return (
                        <button
                          key={optIndex}
                          onClick={() => handleAnswerSelect(optIndex)}
                          disabled={showResult}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                            showResult && showCorrect
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-500'
                              : showIncorrect
                              ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-500'
                              : isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500'
                              : 'bg-white dark:bg-[#0d1117] border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                              showResult && showCorrect
                                ? 'bg-green-500 text-white'
                                : showIncorrect
                                ? 'bg-red-500 text-white'
                                : isSelected
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </div>
                            <span className={`flex-1 text-base ${
                              showResult && showCorrect
                                ? 'text-green-700 dark:text-green-400 font-semibold'
                                : showIncorrect
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {option}
                            </span>
                            {showResult && showCorrect && (
                              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Result Message */}
                {showResult && (
                  <div className={`p-4 rounded-lg ${
                    isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}>
                    <p className={`font-semibold text-center ${
                      isCorrect 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {isCorrect ? '✓ Correct! Great job!' : '✗ Incorrect. The correct answer is highlighted.'}
                    </p>
                  </div>
                )}

                {/* Next Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleNext}
                    disabled={!showResult && selectedAnswer === null}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 text-base sm:text-lg"
                  >
                    {!showResult ? 'Next' : currentQuestionIndex < totalQuestions - 1 ? 'Next' : 'Complete'}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 sticky top-24">
              {/* Sidebar Header */}
              <button
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                className="w-full flex items-center justify-between mb-4 text-gray-900 dark:text-white font-semibold"
              >
                <span>{course?.title || 'Course Content'}</span>
                {sidebarExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {sidebarExpanded && (
                <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {allLessons.map((l, index) => {
                    const isCurrent = l.id === parseInt(lessonId);
                    const progressDisplay = getLessonProgressDisplay(l);
                    const progress = lessonsProgress[l.id];
                    const isCompleted = progress?.percentage === 100;
                    
                    return (
                      <Link
                        key={l.id}
                        href={getLessonRoute(l)}
                        className={`block p-3 rounded-lg transition-colors ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 ${
                            isCurrent ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {getLessonIcon(l)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isCurrent ? 'text-white' : 'text-gray-900 dark:text-white'
                            }`}>
                              {index + 1}. {l.title}
                            </p>
                            {progressDisplay && (
                              <p className={`text-xs mt-1 ${
                                isCurrent ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {progressDisplay}
                              </p>
                            )}
                          </div>
                          {isCompleted && (
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${
                              isCurrent ? 'text-white' : 'text-green-500'
                            }`} />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
