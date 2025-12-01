"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, BookOpen, FileText, Play, ChevronRight, Code, Lightbulb } from "lucide-react";
import Link from "next/link";

export default function TextLessonPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessonProgress, setLessonProgress] = useState(null);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [currentView, setCurrentView] = useState('start'); // 'start', 'exercise', 'content'
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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

      // Fetch current lesson
      const lessonResponse = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
      if (lessonResponse.ok) {
        const lessonData = await lessonResponse.json();
        
        // Check if this is a video lesson - if yes, redirect to video lesson view
        if (lessonData.video_url && lessonData.video_url.trim() !== '') {
          router.replace(`/workspace/my-courses/${courseId}/lesson/${lessonId}`);
          return;
        }
        
        setLesson(lessonData);
        
        // Check if exercises are completed - if yes, show content directly
        await fetchLessonProgress();
      }

    } catch (error) {
      console.error('Error fetching lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonProgress = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`);
      if (response.ok) {
        const progressData = await response.json();
        setLessonProgress(progressData);
        const completed = new Set(progressData.completed_exercises || []);
        setCompletedExercises(completed);
        
        // If all exercises completed, show content view
        const exercises = lesson?.exercises || [];
        if (exercises.length > 0 && completed.size >= exercises.length) {
          setCurrentView('content');
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleStartLesson = () => {
    const exercises = lesson?.exercises || [];
    if (exercises.length > 0) {
      // Start with first exercise
      setCurrentView('exercise');
      setCurrentExerciseIndex(0);
      setCurrentQuestionIndex(0);
    } else {
      // No exercises, go directly to content
      setCurrentView('content');
    }
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  };

  const handleSubmitAnswer = () => {
    const exercises = lesson?.exercises || [];
    const currentExercise = exercises[currentExerciseIndex];
    const currentQuestion = currentExercise?.questions?.[currentQuestionIndex];
    
    if (!currentQuestion) return;
    
    const selectedAnswer = selectedAnswers[currentQuestionIndex];
    const correctAnswer = currentQuestion.correct_answer || 0;
    
    const correct = selectedAnswer === correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleNextQuestion = async () => {
    const exercises = lesson?.exercises || [];
    const currentExercise = exercises[currentExerciseIndex];
    const questions = currentExercise?.questions || [];
    
    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResult(false);
      setSelectedAnswers({});
    } else {
      // All questions in this exercise completed
      const exerciseId = currentExercise.id || currentExerciseIndex;
      await completeExercise(exerciseId);
      
      // Check if more exercises
      if (currentExerciseIndex < exercises.length - 1) {
        // Move to next exercise
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentQuestionIndex(0);
        setShowResult(false);
        setSelectedAnswers({});
      } else {
        // All exercises completed - unlock content
        setCurrentView('content');
      }
    }
  };

  const completeExercise = async (exerciseId) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_exercise_id: exerciseId })
      });
      
      if (response.ok) {
        setCompletedExercises(prev => new Set([...prev, exerciseId]));
        await fetchLessonProgress();
        
        // Check if all exercises completed
        const exercises = lesson?.exercises || [];
        const newCompleted = new Set([...completedExercises, exerciseId]);
        if (exercises.length > 0 && newCompleted.size >= exercises.length) {
          // Mark lesson as complete
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
        }
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
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

  const exercises = lesson.exercises || [];
  const overallProgress = lessonProgress?.completion_percentage || 0;
  const allExercisesCompleted = exercises.length > 0 && completedExercises.size >= exercises.length;

  // START SCREEN
  if (currentView === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-[#0d1117] dark:to-[#1a1f29]">
        {/* Header */}
        <div className="bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <Link 
              href={`/workspace/my-courses/${courseId}?tab=lessons`}
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Lessons</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 md:p-12">
            {/* Lesson Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <FileText className="text-blue-600 dark:text-blue-400 w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {lesson.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                {course?.title} • {course?.teacher_name}
              </p>
            </div>

            {/* Lesson Summary */}
            {lesson.summary && (
              <div className="bg-gray-50 dark:bg-[#1a1f29] rounded-lg p-4 sm:p-6 mb-8">
                <div className="flex items-start gap-3 mb-3">
                  <Lightbulb className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6 mt-0.5 flex-shrink-0" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">What You'll Learn</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
                  {lesson.summary}
                </p>
              </div>
            )}

            {/* Key Concepts Preview */}
            {lesson.key_concepts && lesson.key_concepts.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Key Concepts</h3>
                <div className="flex flex-wrap gap-2">
                  {lesson.key_concepts.map((concept, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs sm:text-sm font-medium"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Exercises Info */}
            {exercises.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 sm:p-6 mb-8 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <Code className="text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {exercises.length} Practice {exercises.length === 1 ? 'Exercise' : 'Exercises'}
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  Complete the exercises to unlock the full lesson content and test your understanding.
                </p>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStartLesson}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 text-base sm:text-lg"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>{exercises.length > 0 ? 'Start Practice' : 'View Lesson Content'}</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Progress Indicator */}
            {allExercisesCompleted && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 text-sm sm:text-base">
                  <CheckCircle className="w-5 h-5" />
                  <span>All exercises completed! You can now view the full lesson content.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // EXERCISE VIEW
  if (currentView === 'exercise') {
    const currentExercise = exercises[currentExerciseIndex];
    const questions = currentExercise?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const exerciseProgress = ((currentExerciseIndex + 1) / exercises.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-[#0d1117] dark:to-[#1a1f29]">
        {/* Header */}
        <div className="bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <Link 
                href={`/workspace/my-courses/${courseId}?tab=lessons`}
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="flex-1 mx-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Exercise {currentExerciseIndex + 1} of {exercises.length}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-3xl">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            {/* Exercise Title */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {currentExercise.title}
              </h2>
              {currentExercise.content && (
                <div 
                  className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: typeof currentExercise.content === 'string' ? currentExercise.content : '' }}
                />
              )}
            </div>

            {/* Question */}
            {currentQuestion && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-[#1a1f29] dark:to-[#1f2937] rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {currentQuestion.question}
                  </h3>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, optIndex) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === optIndex;
                      const showCorrect = showResult && optIndex === (currentQuestion.correct_answer || 0);
                      const showIncorrect = showResult && isSelected && !isCorrect;

                      return (
                        <button
                          key={optIndex}
                          onClick={() => !showResult && handleAnswerSelect(currentQuestionIndex, optIndex)}
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
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                            <span className={`flex-1 ${
                              showResult && showCorrect
                                ? 'text-green-700 dark:text-green-400 font-semibold'
                                : showIncorrect
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {option}
                            </span>
                            {showResult && showCorrect && (
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
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
                    <p className={`font-semibold ${
                      isCorrect 
                        ? 'text-green-700 dark:text-green-400' 
                        : 'text-red-700 dark:text-red-400'
                    }`}>
                      {isCorrect ? '✓ Correct! Great job!' : '✗ Incorrect. Try again or continue to learn more.'}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                  {!showResult ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswers[currentQuestionIndex] === undefined}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {currentQuestionIndex < totalQuestions - 1 || currentExerciseIndex < exercises.length - 1
                        ? 'Next Question'
                        : 'View Lesson Content'}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // CONTENT VIEW (unlocked after exercises)
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117]">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 sm:p-6 border-b border-green-700">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <Link 
                href={`/workspace/my-courses/${courseId}?tab=lessons`}
                className="hover:bg-green-700 p-2 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{lesson.title}</h1>
                <p className="text-green-100 text-sm sm:base truncate">
                  {course?.title} • By {course?.teacher_name}
                </p>
              </div>
            </div>
            {overallProgress === 100 && (
              <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base">
                <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              {/* Success Message */}
              {allExercisesCompleted && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500 w-6 h-6" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">Congratulations!</p>
                      <p className="text-sm text-green-600 dark:text-green-500">You've completed all exercises. Here's the full lesson content.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson Type Icon */}
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <FileText className="text-blue-600 dark:text-blue-500 w-6 h-6 sm:w-8 sm:h-8" />
                <span className="text-gray-600 dark:text-gray-400 uppercase text-xs sm:text-sm font-semibold">
                  Text Lesson
                </span>
              </div>

              {/* Lesson Content */}
              <div className="prose prose-invert dark:prose-invert max-w-none mb-8">
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {lesson.content || (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-500">
                      <FileText size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No content available for this lesson yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Lesson Summary */}
              {lesson.summary && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Lesson Summary</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {lesson.summary}
                  </p>
                </div>
              )}

              {/* Key Concepts */}
              {lesson.key_concepts && lesson.key_concepts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Concepts</h3>
                  <ul className="space-y-2">
                    {lesson.key_concepts.map((concept, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Progress Card */}
            <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Lesson Progress</h3>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${overallProgress === 100 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {overallProgress === 100 ? (
                    <CheckCircle size={20} className="text-white sm:w-6 sm:h-6" />
                  ) : (
                    <BookOpen size={20} className="text-gray-600 dark:text-gray-400 sm:w-6 sm:h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base">
                    {overallProgress === 100 ? 'Completed' : `${overallProgress}% Complete`}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {overallProgress === 100 ? 'You\'ve completed this lesson' : 'Continue learning'}
                  </p>
                </div>
              </div>
            </div>

            {/* Exercises Progress */}
            {exercises.length > 0 && (
              <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Exercises Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Completed</span>
                    <span className="text-gray-900 dark:text-white">
                      {completedExercises.size}/{exercises.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(completedExercises.size / exercises.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Card */}
            <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Navigation</h3>
              <div className="space-y-2 sm:space-y-3">
                <Link
                  href={`/workspace/my-courses/${courseId}?tab=lessons`}
                  className="block w-full text-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Back to Lessons
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
