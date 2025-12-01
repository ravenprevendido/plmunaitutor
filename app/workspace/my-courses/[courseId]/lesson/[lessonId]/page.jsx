"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle, BookOpen, Video, FileText, Play, Pause, Bookmark, Share2 } from "lucide-react";
import Link from "next/link";

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const videoRef = useRef(null);
  
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Summary");
  const [videoProgress, setVideoProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(null);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [lessonsProgress, setLessonsProgress] = useState({});

  useEffect(() => {
    fetchLessonData();
  }, [courseId, lessonId]);

  useEffect(() => {
    // Track video progress
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        setVideoProgress(progress);
        
        // Mark video as watched if > 80% complete
        if (progress >= 80 && !lessonProgress?.video_watched) {
          updateVideoProgress(true);
        }
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', () => {
      updateVideoProgress(true);
      setIsPlaying(false);
    });

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
    };
  }, [lesson, lessonProgress]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData);
      }

      // Fetch all lessons for sidebar - ONLY VIDEO LESSONS
      const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`);
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        // Filter to only show video lessons (lessons with video_url)
        const videoLessons = lessonsData.filter(lesson => lesson.video_url && lesson.video_url.trim() !== '');
        setAllLessons(videoLessons);
        
        // Fetch progress for video lessons only
        const progressPromises = videoLessons.map(async (l) => {
          try {
            const progressRes = await fetch(`/api/courses/${courseId}/lessons/${l.id}/progress`);
            if (progressRes.ok) {
              const progress = await progressRes.json();
              return { lessonId: l.id, progress: progress.completion_percentage || 0 };
            }
          } catch (error) {
            console.error(`Error fetching progress for lesson ${l.id}:`, error);
          }
          return { lessonId: l.id, progress: 0 };
        });
        
        const progressResults = await Promise.all(progressPromises);
        const progressMap = {};
        progressResults.forEach(({ lessonId, progress }) => {
          progressMap[lessonId] = progress;
        });
        setLessonsProgress(progressMap);
      }

      // Fetch current lesson
      const lessonResponse = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
      if (lessonResponse.ok) {
        const lessonData = await lessonResponse.json();
        
        // Check if this is a video lesson - if not, redirect to plain lesson view
        if (!lessonData.video_url || lessonData.video_url.trim() === '') {
          // This is a plain lesson (text + exercises), redirect to plain lesson view
          router.replace(`/workspace/my-courses/${courseId}/text-lesson/${lessonId}`);
          return;
        }
        
        setLesson(lessonData);
      }

      // Fetch lesson progress
      await fetchLessonProgress();

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
        setCompletedExercises(new Set(progressData.completed_exercises || []));
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const updateVideoProgress = async (watched) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_watched: watched })
      });
      
      if (response.ok) {
        await fetchLessonProgress();
        // Update overall course progress
        await fetch(`/api/student-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: parseInt(courseId),
            lesson_id: parseInt(lessonId),
            completed: false // Don't mark complete yet, wait for exercises
          })
        });
      }
    } catch (error) {
      console.error('Error updating video progress:', error);
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
        if (exercises.length > 0 && newCompleted.size >= exercises.length && lessonProgress?.video_watched) {
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
          // Refresh all lessons progress
          await fetchLessonData();
        }
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
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
          <h2 className="text-xl font-bold">Video Lesson Not Found</h2>
          <p className="text-sm mt-2">This lesson doesn't have a video. Redirecting to text lesson view...</p>
          <Link href={`/workspace/my-courses/${courseId}`} className="text-green-600 hover:underline mt-4 inline-block">
            ← Back to Course
          </Link>
        </div>
      </div>
    );
  }

  // Ensure this is a video lesson
  if (!lesson.video_url || lesson.video_url.trim() === '') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white p-6">
        <div className="text-yellow-600 dark:text-yellow-500">
          <h2 className="text-xl font-bold">This is a Text Lesson</h2>
          <p className="text-sm mt-2">This lesson doesn't have a video. Please access it from the lessons tab.</p>
          <Link href={`/workspace/my-courses/${courseId}?tab=lessons`} className="text-green-600 hover:underline mt-4 inline-block">
            ← Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  const exercises = lesson.exercises || [];
  const totalExercises = exercises.length;
  const completedCount = completedExercises.size;
  const overallProgress = lessonProgress?.completion_percentage || 0;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117]">
      {/* Header */}
      <div className="bg-white dark:bg-[#161b22] border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course?.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {lesson.title} • By {course?.teacher_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Bookmark className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Player */}
            {lesson.video_url && (
              <div className="bg-black rounded-lg overflow-hidden">
                <div className="relative aspect-video">
                  <video
                    ref={videoRef}
                    src={lesson.video_url}
                    className="w-full h-full"
                    controls
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-6">
                {["Summary", "Files", "Resources", "Q&A"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 px-1 border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-purple-500 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === "Summary" && (
                <div className="space-y-6">
                  {/* Lesson Recap */}
                  {lesson.summary && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Lesson Recap</h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {lesson.summary}
                      </p>
                    </div>
                  )}

                  {/* Key Concepts */}
                  {lesson.key_concepts && lesson.key_concepts.length > 0 && (
                    <div>
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

                  {/* Practice Exercises */}
                  {exercises.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Practice Exercises</h3>
                      <div className="space-y-4">
                        {exercises.map((exercise, index) => {
                          const exerciseId = exercise.id || index;
                          const isCompleted = completedExercises.has(exerciseId);
                          
                          return (
                            <div
                              key={exerciseId}
                              className="bg-gray-50 dark:bg-[#1a1f29] rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isCompleted
                                      ? 'bg-green-500'
                                      : 'bg-gray-400'
                                  }`}>
                                    {isCompleted ? (
                                      <CheckCircle className="w-5 h-5 text-white" />
                                    ) : (
                                      <span className="text-white text-sm font-bold">{index + 1}</span>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">{exercise.title}</h4>
                                </div>
                                {!isCompleted && (
                                  <button
                                    onClick={() => setSelectedExercise(exercise)}
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                  >
                                    View &gt;
                                  </button>
                                )}
                              </div>
                              {exercise.content && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                  {typeof exercise.content === 'string' 
                                    ? exercise.content.substring(0, 100) + '...'
                                    : 'Exercise content'}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Files" && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No files available for this lesson</p>
                </div>
              )}

              {activeTab === "Resources" && (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No additional resources available</p>
                </div>
              )}

              {activeTab === "Q&A" && (
                <div className="text-center py-12 text-gray-500">
                  <p>Q&A section coming soon</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Study Progress */}
            <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Study Progress</h3>
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallProgress / 100)}`}
                      className="text-green-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{overallProgress}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Track your learning milestones and where you left off.
                </p>
              </div>
            </div>

            {/* Video Lessons List */}
            <div className="bg-white dark:bg-[#161b22] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Video Lessons</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allLessons.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No video lessons available
                  </p>
                ) : (
                  allLessons.map((l, index) => {
                  const isCurrent = l.id === parseInt(lessonId);
                  const progress = lessonsProgress[l.id] || 0;
                  
                  return (
                    <Link
                      key={l.id}
                      href={`/workspace/my-courses/${courseId}/lesson/${l.id}`}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isCurrent
                          ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          progress === 100
                            ? 'bg-blue-500'
                            : progress > 0
                            ? 'bg-blue-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          {progress === 100 ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : progress > 0 ? (
                            <span className="text-white text-xs font-bold">{Math.round(progress)}%</span>
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400 text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCurrent
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {l.title}
                        </p>
                        {l.duration && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {l.duration} min
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Modal */}
      {selectedExercise && (
        <ExerciseModal
          exercise={selectedExercise}
          isOpen={!!selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onComplete={(exerciseId) => {
            completeExercise(exerciseId);
            setSelectedExercise(null);
          }}
        />
      )}
    </div>
  );
}

// Exercise Modal Component
const ExerciseModal = ({ exercise, isOpen, onClose, onComplete }) => {
  const [answers, setAnswers] = useState({});

  if (!isOpen) return null;

  const handleSubmit = () => {
    onComplete(exercise.id || exercise);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#161b22] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{exercise.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {exercise.content && (
            <div 
              className="prose dark:prose-invert max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: typeof exercise.content === 'string' ? exercise.content : '' }}
            />
          )}
          
          {exercise.questions?.map((question, qIndex) => (
            <div key={qIndex} className="mt-6 bg-gray-50 dark:bg-[#1a1f29] p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Question {qIndex + 1}: {question.question}
              </h4>
              <div className="space-y-2">
                {question.options?.map((option, optIndex) => (
                  <label key={optIndex} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      value={optIndex}
                      onChange={(e) => setAnswers({...answers, [qIndex]: parseInt(e.target.value)})}
                      className="text-green-500 focus:ring-green-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Mark as Done
          </button>
        </div>
      </div>
    </div>
  );
};
