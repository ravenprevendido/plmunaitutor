// student/components/AITutorPage.jsx (Updated)
"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { FaRobot, FaUser, FaPaperPlane, FaMagic } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { HiLightBulb, HiAcademicCap, HiBookOpen, HiQuestionMarkCircle } from "react-icons/hi";

export default function AITutorPage() {
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested questions
  const suggestedQuestions = [
    { icon: HiBookOpen, text: "Explain Python functions", category: "Python" },
    { icon: HiAcademicCap, text: "Help with data structures", category: "General" },
    { icon: HiLightBulb, text: "Study tips for exams", category: "General" },
    { icon: HiQuestionMarkCircle, text: "What is machine learning?", category: "General" },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isLoaded) {
      const name = user?.firstName || user?.username;
      setMessages([
        {
          role: "assistant",
          content: `Hello, ${name}! 👋 I'm your AI Tutor. I'm here to help you with your courses, explain concepts, answer questions, and guide your learning journey. What would you like to know?`,
        },
      ]);
    }
  }, [isLoaded, user]);

  const trackStudentQuestion = async (question, aiResponse, subject = 'General') => {
    try {
      const response = await fetch('/api/student-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          ai_response: aiResponse,
          subject,
          course_id: getCourseFromQuestion(question)
        })
      });

      if (!response.ok) {
        console.error('Failed to track question');
      }
    } catch (error) {
      console.error('Error tracking question:', error);
    }
  };

  const getCourseFromQuestion = (question) => {
    // Simple keyword matching - you can enhance this based on your courses
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('python')) return 1;
    if (lowerQuestion.includes('java')) return 2;
    if (lowerQuestion.includes('html') || lowerQuestion.includes('css') || lowerQuestion.includes('web')) return 3;
    if (lowerQuestion.includes('data structure') || lowerQuestion.includes('algorithm')) return 4;
    return null;
  };

  const getSubjectFromQuestion = (question) => {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('python')) return 'Python';
    if (lowerQuestion.includes('java')) return 'Java';
    if (lowerQuestion.includes('html') || lowerQuestion.includes('css') || lowerQuestion.includes('web')) return 'Web Development';
    if (lowerQuestion.includes('data structure') || lowerQuestion.includes('algorithm')) return 'Data Structures';
    if (lowerQuestion.includes('machine learning') || lowerQuestion.includes('ml')) return 'Machine Learning';
    if (lowerQuestion.includes('database') || lowerQuestion.includes('sql')) return 'Database';
    return 'General';
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    const questionText = input;
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      // Send the entire conversation history to maintain context
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: questionText,
          messages: updatedMessages, // Send full conversation history
          mode: "chatbot",
          userId: user?.id, // Pass user ID for quiz question detection
        }),
      });

      const data = await res.json();

      if (data.text) {
        const aiResponse = data.text;
        // Simulate typing delay for better UX
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: aiResponse },
          ]);
          setIsTyping(false);
          // Track the question and AI response
          trackStudentQuestion(questionText, aiResponse, getSubjectFromQuestion(questionText));
        }, 500);
      } else {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't generate an answer. Please try rephrasing your question.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to AI service. Please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full  flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0D1117] dark:via-[#161B22] dark:to-[#0D1117] px-1 md:px-3 sm:px-6 py-4 sm:py-6">
      <div className="w-full max-w-4xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/90 dark:to-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 flex flex-col h-[85vh]  sm:h-[82vh] overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 dark:from-green-600/20 dark:via-emerald-600/20 dark:to-green-500/20 border-b border-gray-200 dark:border-gray-700/50 px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/30 rounded-full blur-lg animate-pulse"></div>
              <div className="relative p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <FaMagic className="text-white text-lg sm:text-xl" />
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Your Personal AI Tutor
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Ask anything about your courses</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 px-3 sm:px-4 md:px-6 py-4 sm:py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className={`flex items-end gap-2 sm:gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md"></div>
                    <div className="relative p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                      <FaRobot className="text-white text-sm sm:text-base" />
                    </div>
                  </div>
                )}

                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base leading-relaxed max-w-[85%] sm:max-w-[75%] md:max-w-[70%] break-words shadow-lg ${
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700/50 text-left"
                      : "bg-gradient-to-br from-green-600 to-emerald-600 text-white text-right shadow-green-500/20"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </motion.div>

                {msg.role === "user" && (
                  <div className="relative shrink-0">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="User Avatar"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-green-500/50 object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-500/50 shadow-lg">
                        <FaUser className="text-white text-xs sm:text-sm" />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start items-center gap-3"
            >
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-md"></div>
                <div className="relative p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                  <FaRobot className="text-white text-sm sm:text-base" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-700/50 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Suggested Questions (show only when no messages or first message) */}
          {messages.length <= 1 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">Try asking:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {suggestedQuestions.map((suggestion, idx) => {
                  const Icon = suggestion.icon;
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(suggestion.text)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 sm:gap-3 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/50 border border-gray-300 dark:border-gray-700/50 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-left transition-all duration-200 group"
                    >
                      <Icon className="text-green-600 dark:text-green-400 text-base sm:text-lg shrink-0 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors" />
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate">
                        {suggestion.text}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={sendMessage}
          className="border-t border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-sm px-3 sm:px-4 md:px-6 py-3 sm:py-4"
        >
          <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800/50 rounded-xl p-2 sm:p-3 border border-gray-300 dark:border-gray-700/50 focus-within:border-green-500/50 focus-within:ring-2 focus-within:ring-green-500/20 transition-all duration-200">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask your question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none px-2 text-sm sm:text-base disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 sm:p-2.5 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-lg transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none group"
            >
              <FaPaperPlane className="text-white text-sm sm:text-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-500 mt-2 text-center">Press Enter to send • AI responses are generated in real-time</p>
        </form>
      </div>
    </div>
  );
}