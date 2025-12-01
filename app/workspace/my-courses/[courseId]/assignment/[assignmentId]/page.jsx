"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Clock, Download, FileText, CheckCircle, Upload } from "lucide-react";

export default function AssignmentPage() {
  const { courseId, assignmentId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignmentData();
  }, [courseId, assignmentId]);

  const fetchAssignmentData = async () => {
    try {
      setLoading(true);
      
      // Fetch assignment details
      const assignmentRes = await fetch(`/api/courses/${courseId}/assignments`);
      if (assignmentRes.ok) {
        const assignments = await assignmentRes.json();
        const foundAssignment = assignments.find(a => a.id === parseInt(assignmentId));
        setAssignment(foundAssignment);
      }

      // Fetch submission status
      if (user?.id) {
        const progressRes = await fetch(`/api/student-progress?course_id=${courseId}&assignment_id=${assignmentId}`);
        if (progressRes.ok) {
          const progress = await progressRes.json();
          setSubmission(progress);
          if (progress?.answers) {
            setAnswer(progress.answers.answer || "");
          }
        }
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() && !submissionFile) {
      alert("Please provide an answer or upload a file");
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('course_id', courseId);
      formData.append('assignment_id', assignmentId);
      formData.append('completed', 'true');
      formData.append('answers', JSON.stringify({ answer: answer }));
      
      if (submissionFile) {
        formData.append('submission_file', submissionFile);
      }

      const response = await fetch('/api/student-progress', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert("Assignment submitted successfully!");
        router.push(`/workspace/my-courses/${courseId}?tab=assignments`);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert("Error submitting assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 p-6">
        <div className="text-red-600 dark:text-red-500">
          <h2 className="text-xl font-bold">Assignment Not Found</h2>
          <p>The assignment you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const isSubmitted = submission?.completed || false;
  const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date() && !isSubmitted;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d1117] text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/workspace/my-courses/${courseId}?tab=assignments`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Assignments
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <FileText size={32} className="text-green-600 dark:text-green-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{assignment.title}</h1>
            {isSubmitted && (
              <CheckCircle size={24} className="text-green-600 dark:text-green-500" />
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {assignment.deadline && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                <Clock size={16} />
                <span>
                  Due: {new Date(assignment.deadline).toLocaleDateString()} at {new Date(assignment.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {isSubmitted && (
              <span className="text-green-400">Submitted</span>
            )}
            {isOverdue && (
              <span className="text-red-400">Overdue</span>
            )}
          </div>
        </div>

        {/* Assignment Description */}
        <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {assignment.description}
          </div>
        </div>

        {/* Attachment */}
        {assignment.attachment_url && (
          <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Attachment</h2>
            <a
              href={assignment.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Download size={20} />
              <span>Download Attachment</span>
            </a>
          </div>
        )}

        {/* Submission Form */}
        {!isSubmitted ? (
          <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Answer</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Answer / Response *
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 min-h-[200px]"
                  placeholder="Enter your answer or response here..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    type="file"
                    id="submission-file"
                    onChange={(e) => setSubmissionFile(e.target.files[0])}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  <label htmlFor="submission-file" className="cursor-pointer flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <Upload size={20} />
                    <span>{submissionFile ? submissionFile.name : "Choose file to upload"}</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => router.push(`/workspace/my-courses/${courseId}?tab=assignments`)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-[#0d1117] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || (!answer.trim() && !submissionFile)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    submitting || (!answer.trim() && !submissionFile)
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {submitting ? "Submitting..." : "Submit Assignment"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#161b22] border border-green-500 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={24} className="text-green-600 dark:text-green-500" />
              <h2 className="text-xl font-semibold text-green-600 dark:text-green-400">Submitted</h2>
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-2">You submitted this assignment on {new Date(submission.submitted_at).toLocaleDateString()}.</p>
              {answer && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Answer:</p>
                  <div className="bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-gray-700 rounded-lg p-4 whitespace-pre-wrap text-gray-900 dark:text-white">
                    {answer}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

