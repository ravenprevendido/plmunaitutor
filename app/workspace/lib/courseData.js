export  const courseData = [
    {
            id: 1,
            title: "Introduction to Python",
            description: "Learn the fundamentals of Python programming",
            progress: 60,
            instructor: "Mr. Lopez",
            lastAccessed: "2 days ago",
            enrolled: true,
            image: "/javascript.png",
            lessons: [
                {title: "1. Python setup", type: "video", status: "viewed", fileUrl: "/files/python-setup.pdf"},
                {title: "2. Variables and Data Types", type: "video", status: "not viewed"},
            ],
            quizzes: [
                {title: "Quiz 1: Python Basics", status: "not taken"},
                {title: "Quiz 2: Data Types", status: "Completed"},
                {title: "Quiz 3: Control Structures", status: "not taken"},
            ],
            assignments: [
                {title: "Assignment 1: Hello World", status: "not submitted"},
                {title: "Assignment 2: Data Types", status: "Submitted"},
            ],
            announcements: [
                {messgae: "New course 'Python' is now available", time: "3 hours ago", type: "new"},
            ]
        },
        {
            id: 2,
            title: "Data Structure & Algorithm",
            description: "Master data structures and algorithms",
            progress: 25,
            instructor: "Mr. Sulasok",
            lastAccessed: "3 days ago",
            enrolled: true,
            image: "/javascript.png",
            lessons:[
                {title: "1. Introduction to Data Structures", type: "video", status: "viewed"},
                {title: "2. Arrays and Linked Lists", type: "video", status: "not viewed"},
                {title: "3. Stacks and Queues", type: "file", status: "not viewed"},
            ],
            quizzes: [
                {title: "Quiz 1: Data Structures Basics", status: "not taken"},
                {title: "Quiz 2: Arrays and Linked Lists", status: "Completed"},
            ],
            assignments: [
                {title: "Assignment 1: Implementing Stacks", status: "not submitted"},
                {title: "Assignment 2: Linked List Operations", status: "Submitted"},
            ],
            announcements: [
                {message: "New assignment 'Linked List Operations' is now available", time: "1 hour ago", type: "new"},
            ]
        },
        {
            id: 3,
            title: "Web Development",
            description: "Build modern web applications",
            progress: 35,
            instructor: "Mrs. Cruz",
            lastAccessed: "1 day ago",
            enrolled: true,
            image: "/javascript.png",
            lessons: [
                {title: "1. HTML Basics", type: "video", status: "viewed"},
                {title: "2. CSS Fundamentals", type: "video", status: "not viewed"},
                {title: "3. JavaScript Introduction", type: "text", status: "not viewed"},
            ],
            quizzes: [
                {title: "Quiz 1: HTML Basics", status: "not taken"},
                {title: "Quiz 2: CSS Fundamentals", status: "Completed"},
            ],
            assignments: [
                {title: "Assignment 1: Build a Simple Web Page", status: "not submitted"},
                {title: "Assignment 2: CSS Styling", status: "Submitted"},
            ],
            announcements: [
                {message: "New course 'Web Development' is now available", time: "2 hours ago", type: "new"},
            ]
        },
        {
            id: 4,
            title: "Objective Oriented Programming",
            description: "Learn OOP concepts and principles",
            progress: 54,
            instructor: "Mr. batongbakal",
            lastAccessed: "5 days ago",
            enrolled: true,
            image: "/javascript.png",
            lessons: [
                {title: "1. OOP Basics", type: "video", status: "viewed"},
                {title: "2. Classes and Objects", type: "video", status: "not viewed"},
                {title: "3. Inheritance and Polymorphism", type: "file", status: "not viewed"},
            ],
            quizzes: [
                {title: "Quiz 1: OOP Basics", status: "not taken"},
                {title: "Quiz 2: Classes and Objects", status: "Completed"},
            ],
            assignments: [
                {title: "Assignment 1: Implementing Classes", status: "not submitted"},
                {title: "Assignment 2: OOP Principles", status: "Submitted"},
            ],
            announcements: [
                {message: "New assignment 'OOP Principles' is now available", time: "2 hours ago", type: "new"},
            ]
        },
        {
            id: 5,
            title: "Java Development",
            description: "Enterprise Java development",
            progress: 23,
            instructor: "Mrs. Pride",
            lastAccessed: "4 days ago",
            enrolled: true,
            image: "/javascript.png",
            lessons: [
                {title: "1. Java Basics", type: "video", status: "viewed"},
                {title: "2. Object-Oriented Programming in Java", type: "video", status: "not viewed"},
                {title: "3. Exception Handling", type: "text", status: "not viewed"},
            ],
            quizzes: [
                {title: "Quiz 1: Java Basics", status: "not taken"},
                {title: "Quiz 2: OOP in Java", status: "Completed"},
            ],
            assignments: [
                {title: "Assignment 1: Java Basics", status: "not submitted"},
                {title: "Assignment 2: OOP Concepts", status: "Submitted"},
            ],
            announcements: [
                {message: "New course 'Java Development' is now available", time: "1 hour ago", type: "new"},
            ]
        }
];