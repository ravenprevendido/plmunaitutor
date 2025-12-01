"use client";

import { Bot } from "lucide-react";

export default function AiTutorCard() {
    return(
        <div className="bg-white dark:bg-[#1a1d24] p-6 rounded-lg space-y-4 shadow-md mt-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Need Help? </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get instant answers for this course</p>
        <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg  text-white transition">
        <Bot className="w-4 h-4"/>
        Ask AI Tutor
        </button>
        </div>
    )
}