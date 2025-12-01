"use client";
import { useRouter } from "next/navigation";
import { FileText, Clock, Download, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function AssignmentTab({ assignments, courseId }) {
  const router = useRouter();
  const { user } = useUser();
  const [submissionStatus, setSubmissionStatus] = useState({});

  useEffect(() => {
    // Fetch submission status for each assignment
    const fetchSubmissionStatus = async () => {
      if (!user?.id) return;
      
      const statusMap = {};
      for (const assignment of assignments) {
        try {
          const response = await fetch(`/api/student-progress?course_id=${courseId}&assignment_id=${assignment.id}`);
          if (response.ok) {
            const progress = await response.json();
            statusMap[assignment.id] = progress?.completed || false;
          }
        } catch (error) {
          console.error('Error fetching submission status:', error);
        }
      }
      setSubmissionStatus(statusMap);
    };

    fetchSubmissionStatus();
  }, [assignments, courseId, user?.id]);

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 dark:text-gray-500">
        <FileText size={48} className="mx-auto mb-4 text-gray-600 dark:text-gray-600" />
        <p>No assignments available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const isSubmitted = submissionStatus[assignment.id] || false;
        const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();
        
        return (
          <div
            key={assignment.id}
            className="p-4 bg-white dark:bg-[#1a1f29] border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 transition-colors cursor-pointer"
            onClick={() => router.push(`/workspace/my-courses/${courseId}/assignment/${assignment.id}`)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="text-green-600 dark:text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                  {isSubmitted && (
                    <CheckCircle size={18} className="text-green-600 dark:text-green-500" />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {assignment.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-500">
                  {assignment.deadline && (
                    <div className={`flex items-center gap-1 ${isOverdue && !isSubmitted ? 'text-red-600 dark:text-red-400' : ''}`}>
                      <Clock size={14} />
                      <span>
                        Due: {new Date(assignment.deadline).toLocaleDateString()} {new Date(assignment.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  {assignment.attachment_url && (
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Download size={14} />
                      <span>Attachment available</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isSubmitted
                      ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                      : isOverdue
                      ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                      : "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                  }`}
                >
                  {isSubmitted ? "Submitted" : isOverdue ? "Overdue" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}