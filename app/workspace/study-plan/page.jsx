// app/workspace/study-plan/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Brain, Target, Clock, BookOpen, Sparkles, CheckCircle2, Play, Trophy, ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';

const StudyPlanList = () => {
  const { user } = useUser();
  const router = useRouter();
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [currentWeek, setCurrentWeek] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [lessonProgress, setLessonProgress] = useState({});

  useEffect(() => {
    generateCurrentWeek();
    loadStudyPlan();
    loadCompletedTasks();
  }, [user?.id]);

  const generateCurrentWeek = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDay + 1);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      week.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        fullDate: date.toISOString().split('T')[0],
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: date.toDateString() === today.toDateString()
      });
    }
    setCurrentWeek(week);
  };

  const loadStudyPlan = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/study-plan?userId=${user.id}`);
      const data = await response.json();

      if (data.studyPlan) {
        setStudyPlan(data.studyPlan);
      } else {
        generateStudyPlan();
        return;
      }
    } catch (error) {
      console.error('Error loading study plan:', error);
      generateStudyPlan();
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedTasks = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/study-plan/completed?userId=${user.id}`);
      const data = await response.json();
      setCompletedTasks(data.completedTasks || []);
    } catch (error) {
      console.error('Error loading completed tasks:', error);
    }
  };

  const saveStudyPlanToDB = async (plan) => {
    if (!user?.id) return plan;

    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          studyPlan: plan
        })
      });

      const data = await response.json();
      return data.studyPlan;
    } catch (error) {
      console.error('Error saving study plan:', error);
      return plan;
    }
  };

  const generateStudyPlan = async (isRegenerating = false) => {
    if (!user?.id) return;

    if (isRegenerating) {
      setRegenerating(true);
    } else {
      setLoading(true);
    }


    
    try {
      const analyticsResponse = await fetch('/api/student-analytics');
      const analyticsData = await analyticsResponse.json();

      const studyPlanData = await generateAIStudyPlan(analyticsData);
      const savedPlan = await saveStudyPlanToDB(studyPlanData);
      setStudyPlan(savedPlan);
      
    } catch (error) {
      console.error('Error generating study plan:', error);
      const fallbackPlan = createFallbackStudyPlan();
      const savedPlan = await saveStudyPlanToDB(fallbackPlan);
      setStudyPlan(savedPlan);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

const generateAIStudyPlan = async (analyticsData) => {
  const weakAreas = analyticsData?.weakAreas || ['Python Basics', 'Java Development', 'Data Structure'];
  
  const prompt = `Create a comprehensive WEEKLY study plan (7 days) for a computer science student focusing on their weak areas: ${weakAreas.join(', ')}.
  
  Generate 1-3 specific study tasks for EACH DAY of the week. Make them practical and actionable.
  Include variety: some days for learning, some for practice, some for review.
  
  Respond with JSON:
  {
    "recommendation": "brief study advice for the week",
    "focusAreas": ["area1", "area2", "area3"],
    "weeklySchedule": [
      {
        "day": "Mon", 
        "tasks": [
          "Study Python functions and practice with exercises",
          "Review Java OOP concepts"
        ]
      },
      {
        "day": "Tue", 
        "tasks": [
          "Practice data structures with coding problems",
          "Work on Python projects"
        ]
      },
      {
        "day": "Wed", 
        "tasks": [
          "Review all weak areas",
          "Take practice quizzes"
        ]
      },
      {
        "day": "Thu", 
        "tasks": [
          "Deep dive into Java collections",
          "Practice algorithm problems"
        ]
      },
      {
        "day": "Fri", 
        "tasks": [
          "Work on coding challenges",
          "Review week's progress"
        ]
      },
      {
        "day": "Sat", 
        "tasks": [
          "Rest day or light review"
        ]
      },
      {
        "day": "Sun", 
        "tasks": [
          "Weekly review and plan next week"
        ]
      }
    ]
  }`;

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        mode: 'study_plan'
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    let aiResponse;
    try {
      aiResponse = JSON.parse(data.text);
      console.log('AI Response:', aiResponse); // Debug log
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.log('Raw AI Text:', data.text);
      aiResponse = createFallbackWeeklyPlan(weakAreas);
    }

    // Validate and ensure we have weekly schedule
    if (!aiResponse.weeklySchedule || !Array.isArray(aiResponse.weeklySchedule)) {
      aiResponse.weeklySchedule = createFallbackWeeklyPlan(weakAreas).weeklySchedule;
    }

    // Map the weekly schedule to match current week dates
    const weeklySchedule = currentWeek.map(dayItem => {
      const aiDay = aiResponse.weeklySchedule.find(d => 
        d.day.toLowerCase().includes(dayItem.day.toLowerCase())
      );
      
      return {
        day: dayItem.day,
        date: dayItem.date,
        tasks: aiDay && aiDay.tasks && aiDay.tasks.length > 0 ? 
          aiDay.tasks.map(task => ({ 
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: task,
            completed: false,
            createdAt: new Date().toISOString(),
            subject: weakAreas.find(area => task.toLowerCase().includes(area.toLowerCase())) || 'General Study',
            estimatedTime: 30 // Default 30 minutes per task
          })) : [],
        isToday: dayItem.isToday
      };
    });

    return {
      recommendation: aiResponse.recommendation || `Focus on improving your ${weakAreas.join(', ')} this week.`,
      focusAreas: aiResponse.focusAreas || weakAreas,
      weeklySchedule: weeklySchedule,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('AI generation failed:', error);
    throw error;
  }
};

  const extractTasksFromText = (text, weakAreas) => {
    const tasks = [];
    weakAreas.forEach(area => {
      tasks.push(`Practice ${area} with coding exercises`);
      tasks.push(`Review ${area} fundamental concepts`);
    });

    return {
      recommendation: `Focus on improving your ${weakAreas.join(', ')}.`,
      focusAreas: weakAreas,
      dailyTasks: tasks.slice(0, 2)
    };
  };

const createFallbackStudyPlan = () => {
  const weakAreas = ['Python Basics', 'Java Development', 'Data Structure'];
  const fallbackPlan = createFallbackWeeklyPlan(weakAreas);
  
  const weeklySchedule = currentWeek.map(dayItem => {
    const fallbackDay = fallbackPlan.weeklySchedule.find(d => 
      d.day.toLowerCase().includes(dayItem.day.toLowerCase())
    );
    
    return {
      day: dayItem.day,
      date: dayItem.date,
      tasks: fallbackDay ? 
        fallbackDay.tasks.map(task => ({ 
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: task,
          completed: false,
          createdAt: new Date().toISOString(),
          subject: weakAreas.find(area => task.includes(area)) || 'General Study',
          estimatedTime: 30
        })) : [],
      isToday: dayItem.isToday
    };
  });



  return {
    recommendation: fallbackPlan.recommendation,
    focusAreas: weakAreas,
    weeklySchedule: weeklySchedule,
    generatedAt: new Date().toISOString()
  };
};


const createFallbackWeeklyPlan = (weakAreas) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const weeklySchedule = days.map(day => {
    let tasks = [];
    
    if (day === 'Mon') {
      tasks = [
        `Study ${weakAreas[0]} fundamentals`,
        `Practice ${weakAreas[0]} coding exercises`
      ];
    } else if (day === 'Tue') {
      tasks = [
        `Work on ${weakAreas[1]} concepts`,
        `Complete ${weakAreas[1]} practice problems`
      ];
    } else if (day === 'Wed') {
      tasks = [
        `Review ${weakAreas[2]} materials`,
        `Solve ${weakAreas[2]} challenges`
      ];
    } else if (day === 'Thu') {
      tasks = [
        `Deep dive into ${weakAreas[0]} advanced topics`,
        `Work on projects using ${weakAreas[0]}`
      ];
    } else if (day === 'Fri') {
      tasks = [
        `Practice all weak areas`,
        `Take assessment quizzes`
      ];
    } else if (day === 'Sat') {
      tasks = ['Rest day - light review only'];
    } else if (day === 'Sun') {
      tasks = ['Weekly review and planning'];
    }
    
    return {
      day: day,
      tasks: tasks
    };
  });

  return {
    recommendation: `This week, focus on practicing ${weakAreas.join(', ')} consistently. Start with fundamentals and gradually move to more complex topics.`,
    focusAreas: weakAreas,
    weeklySchedule: weeklySchedule
  };
};

  const getWeekRange = () => {
    if (!currentWeek.length) return '';
    const start = currentWeek[0];
    const end = currentWeek[6];
    return `Week of ${start.month} ${start.date} - ${end.month} ${end.date}`;
  };

 const markTaskAsDone = async (dayIndex, taskIndex) => {
  if (!user?.id) return;

  const updatedSchedule = [...studyPlan.weeklySchedule];
  
  if (updatedSchedule[dayIndex] && updatedSchedule[dayIndex].tasks[taskIndex]) {
    const taskToComplete = updatedSchedule[dayIndex].tasks[taskIndex];
    
    // Create updated plan without the completed task
    const updatedPlan = {
      ...studyPlan,
      weeklySchedule: updatedSchedule.map((day, idx) => 
        idx === dayIndex 
          ? { ...day, tasks: day.tasks.filter((_, i) => i !== taskIndex) }
          : day
      )
    };

    // Save updated plan to database
    const savedPlan = await saveStudyPlanToDB(updatedPlan);
    setStudyPlan(savedPlan);

    // Mark as completed in database
    await saveCompletedTask(taskToComplete);
    loadCompletedTasks(); // Refresh completed tasks
  }
};

  const saveCompletedTask = async (task) => {
    try {
      await fetch('/api/study-plan/completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          task: task
        })
      });
    } catch (error) {
      console.error('Error saving completed task:', error);
    }
  };

  const viewLessonDetails = async (task, dayIndex, taskIndex) => {
    const dayItem = currentWeek[dayIndex];
    
    // Load existing progress or create new
    let currentPage = 0;
    let progressExists = false;
    try {
      const progressResponse = await fetch(`/api/study-plan/lesson-progress?userId=${user.id}&taskId=${task.id}`);
      const progressData = await progressResponse.json();
      
      if (progressData.progress && progressData.progress.length > 0) {
        currentPage = progressData.progress[0].current_page || 0;
        progressExists = true;
      }
    } catch (error) {
      console.error('Error loading lesson progress:', error);
    }
    
    // If no progress exists, create a new study session (tracks study time)
    if (!progressExists && user?.id) {
      try {
        await fetch('/api/study-plan/lesson-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            taskId: task.id,
            subject: task.subject || studyPlan.focusAreas.find(area => task.text.includes(area)) || 'General Study',
            currentPage: 0,
            totalPages: 7,
            completed: false
          })
        });
        console.log('✅ Study session started - tracking study time');
      } catch (error) {
        console.error('Error creating study session:', error);
      }
    }
    
    // Generate detailed lesson content based on subject
    const lessonContent = generateLessonContent(task.subject || task.text);
    
    setSelectedLesson({
      ...task,
      day: dayItem.day,
      date: dayItem.date,
      taskIndex: taskIndex,
      dayIndex: dayIndex,
      subject: task.subject || studyPlan.focusAreas.find(area => task.text.includes(area)) || 'General Study',
      duration: task.estimatedTime || 10,
      currentPage: currentPage,
      totalPages: lessonContent.pages.length,
      ...lessonContent
    });
  };

  const generateLessonContent = (subject) => {
    const contentTemplates = {
      'Python Basics': {
        title: 'Python Fundamentals Practice',
        description: 'Master the core concepts of Python programming through interactive exercises and practical examples.',
        pages: [
          {
            title: 'Introduction to Python',
            content: 'Python is a high-level, interpreted programming language known for its simplicity and readability. It\'s perfect for beginners and widely used in web development, data science, AI, and more.',
            type: 'theory',
            examples: [
              'print("Hello, World!")',
              '# This is a comment',
              'x = 5  # Variable assignment'
            ]
          },
          {
            title: 'Variables and Data Types',
            content: 'Learn about different data types: integers, floats, strings, and booleans. Variables are like containers that store data values.',
            type: 'theory',
            examples: [
              'age = 25                    # Integer',
              'price = 19.99               # Float',
              'name = "Alice"              # String',
              'is_student = True           # Boolean'
            ]
          },
          {
            title: 'Basic Operations',
            content: 'Perform arithmetic operations and string concatenation. Python supports all basic mathematical operations and string manipulation.',
            type: 'practice',
            exercise: 'Create a program that calculates the area of a rectangle given length and width.'
          },
          {
            title: 'Control Structures',
            content: 'Use if-else statements and loops to control program flow. This allows your program to make decisions and repeat actions.',
            type: 'theory',
            examples: [
              'if x > 0:',
              '    print("Positive number")',
              'for i in range(5):',
              '    print(i)'
            ]
          },
          {
            title: 'Functions',
            content: 'Define and call functions to organize your code. Functions help break down complex problems into smaller, manageable pieces.',
            type: 'practice',
            exercise: 'Write a function that checks if a number is even and returns True or False.'
          },
          {
            title: 'Lists and Dictionaries',
            content: 'Work with collections of data using lists and dictionaries. Lists are ordered collections, while dictionaries store key-value pairs.',
            type: 'theory',
            examples: [
              'fruits = ["apple", "banana", "orange"]',
              'person = {"name": "John", "age": 30, "city": "New York"}'
            ]
          },
          {
            title: 'Final Exercise',
            content: 'Combine all concepts to build a simple program. This exercise will test your understanding of all the Python basics covered.',
            type: 'project',
            exercise: 'Create a student grade calculator that takes marks for 3 subjects and calculates the average grade with appropriate letter grade (A, B, C, D, F).'
          }
        ]
      },
      'Java Development': {
        title: 'Java Programming Essentials',
        description: 'Strengthen your Java programming skills with object-oriented concepts and practical coding challenges.',
        pages: [
          {
            title: 'Java Basics',
            content: 'Understand Java syntax and the structure of a Java program. Java is an object-oriented language known for its "write once, run anywhere" capability.',
            type: 'theory',
            examples: [
              'public class Main {',
              '    public static void main(String[] args) {',
              '        System.out.println("Hello World");',
              '    }',
              '}'
            ]
          },
          {
            title: 'Data Types and Variables',
            content: 'Learn about primitive types and reference types in Java. Java has strong typing, meaning you must declare the type of each variable.',
            type: 'theory',
            examples: [
              'int number = 10;',
              'double price = 19.99;',
              'String name = "Java";',
              'boolean isActive = true;'
            ]
          },
          {
            title: 'Control Flow',
            content: 'Master if-else statements, switch cases, and loops in Java. Control flow statements determine the order in which instructions are executed.',
            type: 'practice',
            exercise: 'Write a program that prints numbers from 1 to 100, but for multiples of 3 print "Fizz", for multiples of 5 print "Buzz", and for both print "FizzBuzz".'
          },
          {
            title: 'Methods',
            content: 'Learn how to create and use methods (functions) in Java. Methods help organize code and make it reusable.',
            type: 'theory',
            examples: [
              'public static int add(int a, int b) {',
              '    return a + b;',
              '}'
            ]
          },
          {
            title: 'Classes and Objects',
            content: 'Understand object-oriented programming basics with classes and objects. Java is fundamentally object-oriented.',
            type: 'practice',
            exercise: 'Create a Student class with properties like name, age, and grade, then create objects of this class.'
          },
          {
            title: 'Arrays and Collections',
            content: 'Work with arrays and ArrayList for storing collections of data. Arrays have fixed size while ArrayLists can grow dynamically.',
            type: 'theory',
            examples: [
              'int[] numbers = {1, 2, 3, 4, 5};',
              'ArrayList<String> names = new ArrayList<>();'
            ]
          },
          {
            title: 'Final Project',
            content: 'Apply all Java concepts to build a complete application. This will test your understanding of Java fundamentals.',
            type: 'project',
            exercise: 'Create a simple Bank Account management system with deposit, withdraw, and balance check functionality.'
          }
        ]
      },
      'Data Structure': {
        title: 'Data Structures and Algorithms',
        description: 'Master fundamental data structures and their implementations to solve complex problems efficiently.',
        pages: [
          {
            title: 'Introduction to Data Structures',
            content: 'Understand what data structures are and why they are important. Learn about time and space complexity analysis.',
            type: 'theory',
            examples: [
              '// Array: O(1) access time',
              '// Linked List: O(n) access time',
              '// Different structures for different needs'
            ]
          },
          {
            title: 'Arrays',
            content: 'Learn about array operations and their time complexity. Arrays provide fast access but fixed size.',
            type: 'theory',
            examples: [
              'int[] arr = new int[5];',
              'arr[0] = 10; // O(1) access',
              '// Searching: O(n)',
              '// Insertion: O(n)'
            ]
          },
          {
            title: 'Linked Lists',
            content: 'Understand singly and doubly linked lists. Linked lists provide efficient insertions and deletions.',
            type: 'practice',
            exercise: 'Implement a singly linked list with methods for insertion, deletion, and traversal.'
          },
          {
            title: 'Stacks and Queues',
            content: 'Learn about stack (LIFO) and queue (FIFO) data structures and their applications.',
            type: 'theory',
            examples: [
              '// Stack: push, pop, peek',
              '// Queue: enqueue, dequeue',
              '// Used in DFS and BFS algorithms'
            ]
          },
          {
            title: 'Trees',
            content: 'Introduction to tree data structures, including binary trees and BST (Binary Search Trees).',
            type: 'practice',
            exercise: 'Implement a binary search tree with insertion and search operations.'
          },
          {
            title: 'Sorting Algorithms',
            content: 'Learn fundamental sorting algorithms: Bubble Sort, Selection Sort, Insertion Sort, and Merge Sort.',
            type: 'theory',
            examples: [
              '// Bubble Sort: O(n²)',
              '// Merge Sort: O(n log n)',
              '// Choose algorithm based on data size'
            ]
          },
          {
            title: 'Problem Solving',
            content: 'Apply data structures to solve real-world problems efficiently.',
            type: 'project',
            exercise: 'Solve the "Two Sum" problem using a hash map for O(n) time complexity instead of the naive O(n²) approach.'
          }
        ]
      }
    };

    const matchedSubject = Object.keys(contentTemplates).find(key => 
      subject.toLowerCase().includes(key.toLowerCase())
    );

    return contentTemplates[matchedSubject] || {
      title: subject,
      description: 'This session focuses on strengthening your understanding through practical application and hands-on exercises.',
      pages: Array(7).fill().map((_, i) => ({
        title: `${subject} - Lesson ${i + 1}`,
        content: `This is page ${i + 1} of your ${subject} lesson. Focus on understanding the core concepts and completing the practice exercises to strengthen your knowledge.`,
        type: i % 2 === 0 ? 'theory' : 'practice',
        examples: i % 2 === 0 ? [
          `Example ${i + 1}.1 for ${subject}`,
          `Example ${i + 1}.2 for ${subject}`
        ] : undefined,
        exercise: i > 0 && i % 2 !== 0 ? `Practice exercise for ${subject} - Page ${i + 1}` : null
      }))
    };
  };

  const closeLessonView = () => {
    setSelectedLesson(null);
    loadStudyPlan(); // Refresh to show any completed tasks
  };

  const navigateToPending = () => {
    router.push('/workspace/study-plan/pending');
  };

  const navigateToCompleted = () => {
    router.push('/workspace/study-plan/completed');
  };

  const navigateToFocusAreas = () => {
    router.push('/workspace/study-plan/focus-areas');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#161B22] text-gray-900 dark:text-white min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-600 dark:text-green-400">Loading your study plan...</p>
        </div>
      </div>
    );
  }

  const totalTasks = studyPlan?.weeklySchedule?.reduce((total, day) => total + day.tasks.length, 0) || 0;
  const focusAreasCount = studyPlan?.focusAreas?.length || 0;
  const totalCompleted = completedTasks.length;

  return (
    <div className="bg-white dark:bg-[#161B22] text-gray-900 dark:text-white min-h-screen p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">📚 Study Plan</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-sm md:text-base">{getWeekRange()}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Hello, {user?.firstName || 'Student'}!</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Your AI-powered study companion</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div 
            onClick={navigateToPending}
            className="bg-gray-50 dark:bg-[#1f2937] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-500 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors shrink-0">
                <ListChecks size={18} className="text-white sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTasks}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Pending Tasks</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 hidden sm:block">Click to view details →</p>
              </div>
            </div>
          </div>

          <div 
            onClick={navigateToFocusAreas}
            className="bg-gray-50 dark:bg-[#1f2937] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-500 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-600 rounded-lg group-hover:bg-purple-700 transition-colors shrink-0">
                <Target size={18} className="text-white sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{focusAreasCount}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Focus Areas</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 hidden sm:block">Click to view details →</p>
              </div>
            </div>
          </div>

          <div 
            onClick={navigateToCompleted}
            className="bg-gray-50 dark:bg-[#1f2937] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-500 cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-600 rounded-lg group-hover:bg-green-700 transition-colors shrink-0">
                <Trophy size={18} className="text-white sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{totalCompleted}</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Completed Tasks</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 hidden sm:block">Click to view details →</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation Card */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 border border-green-200 dark:border-green-700/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="p-2 bg-green-600 rounded-lg w-fit">
              <Brain size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Recommendation</h3>
              <p className="text-green-700 dark:text-green-300 text-sm">Personalized based on your progress</p>
            </div>
          </div>
          <p className="text-gray-800 dark:text-green-100 text-base sm:text-lg leading-relaxed mb-4 sm:mb-0">{studyPlan?.recommendation}</p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {studyPlan?.focusAreas?.map((area, idx) => (
              <span 
                key={idx} 
                className="bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 text-xs sm:text-sm px-3 py-2 rounded-full flex items-center gap-2 border border-green-300 dark:border-green-700/30"
              >
                <Target size={14} />
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* Weekly Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full auto-rows-fr">
          {currentWeek.map((dayItem, dayIndex) => {
            const daySchedule = studyPlan?.weeklySchedule?.find(s => 
              s.day.toLowerCase().includes(dayItem.day.toLowerCase())
            ) || { tasks: [] };
            
            return (
              <div 
                key={dayIndex} 
                className={`bg-gray-50 dark:bg-[#1f2937] rounded-xl p-3 sm:p-4 border transition-all duration-300 min-w-0 w-full flex flex-col ${
                  dayItem.isToday 
                    ? 'border-green-500 ring-2 ring-green-500/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-500/30'
                }`}
              >
                <div className="flex justify-between items-center mb-3 sm:mb-4 flex-shrink-0">
                  <h3 className={`font-semibold text-sm sm:text-base ${
                    dayItem.isToday ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {dayItem.day}
                  </h3>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{dayItem.date}</span>
                    {dayItem.isToday && (
                      <span className="block text-xs text-green-600 dark:text-green-400 font-medium">Today</span>
                    )}
                  </div>
                </div>

                {daySchedule.tasks.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 flex-1 min-h-0">
                    {daySchedule.tasks.map((task, taskIndex) => (
                      <div 
                        key={task.id}
                        className="bg-green-900/20 text-green-300 text-xs sm:text-sm p-2.5 sm:p-3 rounded-lg border border-green-700/30 group hover:bg-green-900/30 transition-colors"
                      >
                        <div className="flex items-start gap-2.5 w-full">
                          <BookOpen size={14} className="mt-0.5 shrink-0 text-green-400 sm:w-4 sm:h-4" />
                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <p className="leading-relaxed text-xs sm:text-sm wrap-break-word overflow-wrap-anywhere">{task.text}</p>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Clock size={12} className="text-green-400 shrink-0" />
                                <span className="text-xs text-green-400 whitespace-nowrap">{task.estimatedTime || 10} mins</span>
                              </div>
                              <button
                                onClick={() => viewLessonDetails(task, dayIndex, taskIndex)}
                                className="opacity-70 hover:opacity-100 transition-opacity text-xs bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 sm:py-1 rounded text-white flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
                              >
                                <Play size={12} className="shrink-0" />
                                <span>Start</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6">
                    <Clock size={20} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 italic">No study tasks scheduled</p>
                    <p className="text-xs text-gray-600 dark:text-gray-600 mt-1">Rest day</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Regenerate Button */}
        <div className="flex justify-center">
          <button
            onClick={() => generateStudyPlan(true)}
            disabled={regenerating}
            className={`
              relative overflow-hidden px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base
              flex items-center gap-2 sm:gap-3 transition-all duration-300 w-full sm:w-auto justify-center
              ${regenerating 
                ? 'bg-green-700 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25'
              }
            `}
          >
            {regenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                <span>Regenerating Plan...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-white" />
                <span>Regenerate Study Plan</span>
              </>
            )}
          </button>
        </div>

        {/* Enhanced Lesson Detail Modal */}
        {selectedLesson && (
          <LessonModal 
            lesson={selectedLesson}
            onClose={closeLessonView}
            onMarkAsDone={markTaskAsDone}
            userId={user?.id}
          />
        )}
      </div>
    </div>
  );
};

// Enhanced Lesson Modal Component with SoloLearn-style navigation
const LessonModal = ({ lesson, onClose, onMarkAsDone, userId }) => {
  const [currentPage, setCurrentPage] = useState(lesson.currentPage || 0);
  const [isCompleted, setIsCompleted] = useState(false);
  const totalPages = lesson.pages?.length || 7;

  useEffect(() => {
    // Save progress when page changes
    if (userId && lesson.id) {
      saveProgress();
    }
  }, [currentPage, userId, lesson.id]);

  const saveProgress = async () => {
    try {
      await fetch('/api/study-plan/lesson-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          taskId: lesson.id,
          subject: lesson.subject,
          currentPage: currentPage,
          totalPages: totalPages,
          completed: currentPage >= totalPages - 1
        })
      });
    } catch (error) {
      console.error('Error saving lesson progress:', error);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleMarkAsDone = () => {
    onMarkAsDone(lesson.dayIndex, lesson.taskIndex);
    onClose();
  };

  const currentPageData = lesson.pages?.[currentPage] || {
    title: `Page ${currentPage + 1}`,
    content: 'Continue learning...',
    type: 'theory'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-[#1f2937] rounded-xl border border-gray-200 dark:border-green-700/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {lesson.title}
              </h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span>Page {currentPage + 1} of {totalPages}</span>
                <span>•</span>
                <span className="capitalize">{currentPageData.type}</span>
                <span>•</span>
                <span>{lesson.subject}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            ></div>
          </div>

          {/* Lesson Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {currentPageData.title}
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {currentPageData.content}
              </p>
            </div>

            {/* Examples */}
            {currentPageData.examples && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-lg p-4 mb-4">
                <h4 className="text-blue-700 dark:text-blue-300 font-semibold mb-2">Examples:</h4>
                {currentPageData.examples.map((example, idx) => (
                  <pre key={idx} className="bg-gray-100 dark:bg-black/30 p-3 rounded text-sm text-green-700 dark:text-green-300 mb-2 overflow-x-auto">
                    {example}
                  </pre>
                ))}
              </div>
            )}

            {/* Exercise */}
            {currentPageData.exercise && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 rounded-lg p-4">
                <h4 className="text-purple-700 dark:text-purple-300 font-semibold mb-2">
                  {currentPageData.type === 'project' ? '🎯 Final Project:' : '💻 Exercise:'}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{currentPageData.exercise}</p>
                <div className="mt-3 p-3 bg-gray-100 dark:bg-black/30 rounded">
                  <textarea 
                    className="w-full bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm"
                    rows="4"
                    placeholder="Write your solution here..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                currentPage === 0 
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              {isCompleted || currentPage === totalPages - 1 ? (
                <button
                  onClick={handleMarkAsDone}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Mark as Done
                </button>
              ) : (
                <button
                  onClick={nextPage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-sm"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanList;