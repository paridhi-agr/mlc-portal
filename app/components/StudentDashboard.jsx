"use client";
import React, { useState, useEffect } from 'react';
import { HeaderIcon } from "./HeaderIcon";
import { signOut } from 'next-auth/react';
import { ClipboardList, LogOut, FileText, Download, CheckCircle } from 'lucide-react';

const StudentDashboard = ({session}) => {
    const [assignments, setAssignments] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submittingId, setSubmittingId] = useState(null);

    useEffect(() => {
      fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
      try {
        const response = await fetch('/api/assignments');
        const data = await response.json();
        setAssignments(data.assignments || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoadingData(false);
      }
    };

    const handleMarkAsSubmitted = async (assignmentId) => {
      setSubmittingId(assignmentId);

      try {
        const response = await fetch('/api/assignments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId,
            action: 'markSubmitted',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to mark as submitted');
        }

        // Refresh assignments
        await fetchAssignments();
      } catch (error) {
        console.error('Error marking assignment as submitted:', error);
        alert('Failed to mark assignment as submitted. Please try again.');
      } finally {
        setSubmittingId(null);
      }
    };

    const getStatusBadge = (status) => {
      const styles = {
        assigned: 'bg-blue-100 text-blue-800',
        submitted: 'bg-yellow-100 text-yellow-800',
        graded: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800'
      };
      return (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-[#fdf8eb] shadow-sm w-full">
          <div className="flex items-center justify-between">
            {/* LEFT: Icon flush to edge */}
            <HeaderIcon className="block" />

            {/* RIGHT: User actions */}
            <div className="flex items-center space-x-4 pr-4 sm:pr-6 lg:pr-8">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-gray-700">
                Welcome, {session?.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Assignments</h1>

          {loadingData ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {assignments.map(assignment => (
                <div key={assignment.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {assignment.worksheetName}
                      </h3>
                      {assignment.worksheetDescription && (
                        <p className="text-gray-600 mb-3">{assignment.worksheetDescription}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        {assignment.submittedDate && (
                          <span>Submitted: {new Date(assignment.submittedDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>

                  {/* File Links */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <a
                      href={`https://drive.google.com/file/d/${assignment.worksheetFileId}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-orange-400 hover:text-orange-500 text-sm hover:font-semibold"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Assignment</span>
                    </a>

                    {assignment.solutionFileId && (
                      <a
                        href={`https://drive.google.com/file/d/${assignment.solutionFileId}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 text-sm hover:font-semibold"
                      >
                        <Download className="w-4 h-4" />
                        <span>View Solution</span>
                      </a>
                    )}

                    {/* {assignment.submissionFileId && (
                      <a
                        href={`https://drive.google.com/file/d/${assignment.submissionFileId}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Your Submission</span>
                      </a>
                    )} */}

                    {assignment.gradedFileId && (
                      <a
                        href={`https://drive.google.com/file/d/${assignment.gradedFileId}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 text-sm hover:font-semibold"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>View Graded Submission</span>
                      </a>
                    )}
                  </div>

                  {assignment.status === 'graded' && assignment.score && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-green-800 font-semibold">Score:</span>
                        <span className="text-2xl font-bold text-green-600">{assignment.score}</span>
                      </div>
                    </div>
                  )}

                  {assignment.status === 'assigned' && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mt-4">
                        Upload your work to the assignment folder in Google Drive, then click this button.
                      </p>
                      <button
                        onClick={() => handleMarkAsSubmitted(assignment.id)}
                        disabled={submittingId === assignment.id}
                        className="bg-orange-400 text-white px-6 py-2 rounded-lg hover:bg-orange-500 transition inline-flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {submittingId === assignment.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Mark as Submitted</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {assignment.status === 'submitted' && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800">
                      Awaiting teacher review
                    </div>
                  )}

                  {assignment.status === 'overdue' && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
                      This assignment is overdue
                    </div>
                  )}
                </div>
              ))}

              {assignments.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                  <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No assignments yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

export default StudentDashboard;