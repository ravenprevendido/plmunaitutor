"use client";

export default function AnnouncementTab({announcements}) {
    return(
        <div className="space-y-4">
            {announcements.map((announcement, index) => (
                <div key={index} className="p-5 bg-white dark:bg-gray-800 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-900 dark:text-white">{announcement.message}</p>
                </div>
            ))}
        </div>
    )
}