"use client"
import React, { useEffect, useState, useContext } from 'react'
import { BotIcon, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useUser } from "@clerk/nextjs"
import { UserDetailContext } from '@/context/UserDetailContext'

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [animate, setAnimate] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const { user, isLoaded } = useUser();
    const { userDetail } = useContext(UserDetailContext) || {};

    // Animation for the bot icon
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimate(true);
            setTimeout(() => setAnimate(false), 8000);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Initialize with welcome message
    useEffect(() => {
        if (isLoaded && isOpen && messages.length === 0) {
            const name = user?.firstName || user?.username || "there";
            setMessages([
                {
                    role: "assistant",
                    content: `Hello, ${name}! I'm your PLMun AI Tutor. How can I help you with your studies today? 👋`
                },
            ]);
        }
    }, [isLoaded, isOpen, user, messages.length]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: input,
                    mode: "chatbot",
                }),
            });

            const data = await res.json();

            if (data.text) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: data.text },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "Sorry, I couldn't generate an answer at the moment. Please try again.",
                    },
                ]);
            }
        } catch (error) {
            console.error("Error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Error connecting to AI service. Please check your connection." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const pathname = usePathname();
    if (
        pathname === '/' ||
        pathname.startsWith("/LandingPage") ||
        !isLoaded ||
        userDetail?.role !== 'student'
    ) {
        return null;
    }

    return (
        <div>
            <motion.div
                onClick={() => setIsOpen(!isOpen)}
                className='fixed bottom-4 right-6 z-50 cursor-pointer'
                whileHover={{ scale: 1.1 }}
            >
                <motion.div
                    animate={animate ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                    transition={{ duration: 0.8 }}
                    className='bg-gradient-to-r from-green-600 to-emerald-500 p-4 rounded-full shadow-lg'
                >
                    <BotIcon className='w-7 h-7 text-white' />
                </motion.div>
            </motion.div>

            {/* Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className='fixed bottom-20 right-6 bg-white dark:bg-[#1d1f2b] border border-gray-200 dark:border-[#2a2d3c] text-gray-900 dark:text-white w-80 h-96 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden'
                    >
                        {/* Header */}
                        <div className='flex justify-between items-center p-4 border-b border-gray-200 dark:border-[#2a2d3c] bg-gray-50 dark:bg-[#13181f]'>
                            <div className='flex items-center gap-2'>
                                <BotIcon className='w-5 h-5 text-green-600 dark:text-green-400' />
                                <h3 className='text-sm font-semibold text-gray-900 dark:text-white'>PLMun AI Tutor</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)}>
                                <X className='w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white' />
                            </button>
                        </div>

                        {/* Messages Container */}
                        <div className='flex-1 p-4 overflow-y-auto space-y-3 bg-white dark:bg-[#1d1f2b]'>
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-lg ${
                                            msg.role === "user"
                                                ? "bg-green-600 dark:bg-[#238636] text-white"
                                                : "bg-gray-100 dark:bg-[#232935] text-gray-900 dark:text-gray-100"
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-[#232935] p-3 rounded-lg max-w-[80%]">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                                <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                            </div>
                                            Thinking...
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Form */}
                        <div className='p-4 border-t border-gray-200 dark:border-[#2a2d3c] bg-gray-50 dark:bg-[#13181f]'>
                            <form onSubmit={sendMessage} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Ask your question here..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={loading}
                                    className="flex-1 bg-white dark:bg-[#232935] border border-gray-300 dark:border-[#2a2d3c] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-green-500 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="bg-green-600 dark:bg-[#238636] hover:bg-green-700 dark:hover:bg-[#2EA043] disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed p-2 rounded-lg transition-all duration-200 text-white font-semibold text-sm"
                                >
                                    ➤
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ChatBot