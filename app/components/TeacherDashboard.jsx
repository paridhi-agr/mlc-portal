"use client";
import React, { useState, useEffect } from 'react';
import { Users, LogOut, FileText, Plus, X, Download } from 'lucide-react';
import { HeaderIcon } from "./HeaderIcon";
import { signOut} from 'next-auth/react';

const TeacherDashboard = ({session}) => {
    const [activeTab, setActiveTab] = useState('students');
    const [activeStudentId, setActiveStudentId] = useState(null);
    const [students, setStudents] = useState([]);
    const [assignmentFolders, setAssignmentFolders] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState({ assignment: null });
    const [folderFiles, setFolderFiles] = useState([]);
    const [dueDate, setDueDate] = useState('');
    const [assignmentDescription, setAssignmentDescription] = useState('');
    const [gradeModalData, setGradeModalData] = useState(null);
    const [gradeScore, setGradeScore] = useState('');
    const [selectedSolutionFile, setSelectedSolutionFile] = useState('');
    const [selectedGradedFile, setSelectedGradedFile] = useState('');
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
      fetchData();
    }, []);

    useEffect(() => {
      // Set first student as active when students load
      if (students.length > 0 && !activeStudentId) {
        setActiveStudentId(students[0].id);
      }
    }, [students]);

    const fetchData = async () => {
      try {
        const [studentsRes, foldersRes, assignmentsRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/drive?action=listFolders'),
          fetch('/api/assignments'),
        ]);

        const studentsData = await studentsRes.json();
        const foldersData = await foldersRes.json();
        const assignmentsData = await assignmentsRes.json();

        setStudents(studentsData.students || []);
        setAssignmentFolders(foldersData.folders || []);
        setAssignments(assignmentsData.assignments || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    const handleFolderSelect = async (folderId) => {
      setSelectedFolder(folderId);
      try {
        const response = await fetch(`/api/drive?action=listFiles&folderId=${folderId}`);
        const data = await response.json();
        setFolderFiles(data.files || []);
      } catch (error) {
        console.error('Error fetching folder files:', error);
      }
    };

    const handleAssignHomework = async () => {
      if (!selectedStudent || !selectedFolder || !selectedFiles.assignment || !dueDate) {
        alert('Please fill all required fields');
        return;
      }

      const folder = assignmentFolders.find(f => f.id === selectedFolder);
      const assignmentFile = folderFiles.find(f => f.id === selectedFiles.assignment);

      try {
        const response = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: selectedStudent,
            worksheetName: folder.name.split('_')[0],
            worksheetDescription: assignmentDescription || '',
            worksheetFolderId: selectedFolder,
            worksheetFileId: selectedFiles.assignment,
            worksheetFileName: assignmentFile.name,
            solutionFileId: null,
            dueDate: new Date(dueDate).toISOString(),
          }),
        });

        if (response.ok) {
          setShowAssignModal(false);
          setSelectedStudent(null);
          setSelectedFolder(null);
          setSelectedFiles({ assignment: null });
          setFolderFiles([]);
          setDueDate('');
          setAssignmentDescription('');
          fetchData();
        }
      } catch (error) {
        console.error('Error assigning homework:', error);
      }
    };

    const openGradeModal = async (assignment) => {
      setGradeModalData(assignment);
      setGradeScore('');
      setSelectedSolutionFile('');
      setSelectedGradedFile('');

      // Fetch files from the assignment folder
      if (assignment.worksheetFolderId) {
        try {
          const response = await fetch(`/api/drive?action=listFiles&folderId=${assignment.worksheetFolderId}`);
          const data = await response.json();
          setFolderFiles(data.files || []);
        } catch (error) {
          console.error('Error fetching folder files:', error);
        }
      }
    };

    const handleGradeSubmission = async () => {
      if (!gradeModalData) return;

      // Validate: either score or both files must be provided
      const hasScore = gradeScore && gradeScore >= 0 && gradeScore <= 100;
      const hasFiles = selectedSolutionFile && selectedGradedFile;

      if (!hasScore && !hasFiles) {
        alert('Please enter a score (0-100) or select both solution and graded files');
        return;
      }

      try {
        const updateData = {
          assignmentId: gradeModalData.id,
          action: 'grade',
        };

        // Add score if provided
        if (hasScore) {
          updateData.score = parseInt(gradeScore);
        }

        // Add solution file if selected
        if (selectedSolutionFile) {
          updateData.solutionFileId = selectedSolutionFile;
        }

        // Add graded file if selected
        if (selectedGradedFile) {
          updateData.gradedFileId = selectedGradedFile;
        }

        const response = await fetch('/api/assignments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          setGradeModalData(null);
          setGradeScore('');
          setSelectedSolutionFile('');
          setSelectedGradedFile('');
          setFolderFiles([]);
          fetchData();
        }
      } catch (error) {
        console.error('Error grading submission:', error);
      }
    };

    const getDefaultDueDate = () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date.toISOString().split('T')[0];
    };

    // Get active student's assignments
    const activeStudentAssignments = activeStudentId
      ? assignments.filter(a => a.studentId === activeStudentId)
      : [];

    const activeStudent = students.find(s => s.id === activeStudentId);

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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <button
              onClick={() => {
                setShowAssignModal(true);
                setDueDate(getDefaultDueDate());
              }}
              className="bg-orange-400 text-white px-6 py-2 rounded-lg hover:bg-orange-500 transition flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Assign Homework</span>
            </button>
          </div>

          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'students'
                ? 'bg-orange-400 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === 'assignments'
                ? 'bg-orange-400 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              Assignment Folders
            </button>
          </div>

          {loadingData ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
            </div>
          ) : (
            <>
              {activeTab === 'students' && (
                <div>
                  {/* Student Tabs */}
                  {students.length > 0 && (
                    <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                      {students.map(student => (
                        <button
                          key={student.id}
                          onClick={() => setActiveStudentId(student.id)}
                          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${activeStudentId === student.id
                            ? 'bg-amber-50 text-orange-500 border-2 border-orange-400'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                        >
                          {student.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active Student Details */}
                  {activeStudent && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                      <div className="flex items-center mb-4">
                        {activeStudent.image && (
                          <img src={activeStudent.image} alt={activeStudent.name} className="w-16 h-16 rounded-full mr-4" />
                        )}
                        <div>
                          <h2 className="text-2xl font-semibold text-gray-900">{activeStudent.name}</h2>
                          <p className="text-gray-600">{activeStudent.email}</p>
                        </div>
                      </div>

                      {/* Student's Assignments */}
                      {activeStudentAssignments.length > 0 ? (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignments</h3>
                          {activeStudentAssignments.map(assignment => (
                            <div
                              key={assignment.id}
                              className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                            >
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{assignment.worksheetName}</p>
                                {assignment.worksheetDescription && (
                                  <p className="text-sm text-gray-600 mt-1">{assignment.worksheetDescription}</p>
                                )}
                                <p className="text-sm text-gray-600 mt-1">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </p>
                                {assignment.submittedDate && (
                                  <p className="text-sm text-gray-600">
                                    Submitted: {new Date(assignment.submittedDate).toLocaleDateString()}
                                  </p>
                                )}
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${assignment.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                  assignment.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                    assignment.status === 'graded' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                  }`}>
                                  {assignment.status}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4">
                                {assignment.status === 'graded' && (
                                  <span className="text-lg font-bold text-green-600">
                                    {assignment.score}
                                  </span>
                                )}
                                {assignment.status === 'submitted' && (
                                  <button
                                    onClick={() => openGradeModal(assignment)}
                                    className="bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition"
                                  >
                                    Grade
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No assignments yet</p>
                      )}
                    </div>
                  )}

                  {students.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No students registered yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'assignments' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignmentFolders.map(folder => (
                    <div key={folder.id} className="bg-white rounded-lg shadow-md p-6">
                      <FileText className="w-12 h-12 text-orange-400 mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{folder.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Created: {new Date(folder.createdTime).toLocaleDateString()}
                      </p>
                      <a
                        href={folder.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-500 text-sm"
                      >
                        View in Drive →
                      </a>
                    </div>
                  ))}

                  {assignmentFolders.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-md">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No assignment folders found</p>
                      <p className="text-sm text-gray-500 mt-2">Create an "Assignments" folder in your Google Drive</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Assign Homework Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Assign Homework</h3>
                <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                {/* Student Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Student <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedStudent || ''}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Choose a student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>

                {/* Folder Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Assignment Folder <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedFolder || ''}
                    onChange={(e) => handleFolderSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Choose a folder</option>
                    {assignmentFolders.map(folder => (
                      <option key={folder.id} value={folder.id}>{folder.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assignment Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assignment Description (Optional)
                  </label>
                  <textarea
                    value={assignmentDescription}
                    onChange={(e) => setAssignmentDescription(e.target.value)}
                    placeholder="Enter assignment description or instructions..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* Assignment File Selection */}
                {selectedFolder && folderFiles.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Assignment File <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedFiles.assignment || ''}
                      onChange={(e) => setSelectedFiles({ ...selectedFiles, assignment: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Choose assignment file</option>
                      {folderFiles.map(file => (
                        <option key={file.id} value={file.id}>{file.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleAssignHomework}
                  disabled={!selectedStudent || !selectedFolder || !selectedFiles.assignment || !dueDate}
                  className="flex-1 bg-orange-400 text-white py-2 rounded-lg hover:bg-orange-500 transition disabled:bg-gray-400"
                >
                  Assign
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStudent(null);
                    setSelectedFolder(null);
                    setSelectedFiles({ assignment: null });
                    setFolderFiles([]);
                    setDueDate('');
                    setAssignmentDescription('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grade Modal */}
        {gradeModalData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">Grade Submission</h3>
                <button onClick={() => setGradeModalData(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mb-2">
                Student: {gradeModalData.student?.name}
              </p>
              <p className="text-gray-600 mb-4">
                Worksheet: {gradeModalData.worksheetName}
              </p>

              {/* View Submission */}
              {gradeModalData.submissionFileId && (
                <a
                  href={`https://drive.google.com/file/d/${gradeModalData.submissionFileId}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-orange-400 hover:text-orange-500 mb-6"
                >
                  <Download className="w-4 h-4" />
                  <span>View Submission</span>
                </a>
              )}

              <div className="space-y-4">
                {/* Score Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    placeholder="Enter score or leave blank"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                {/* Solution File Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Solution File (Optional)
                  </label>
                  <select
                    value={selectedSolutionFile}
                    onChange={(e) => setSelectedSolutionFile(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">No solution file</option>
                    {folderFiles.map(file => (
                      <option key={file.id} value={file.id}>{file.name}</option>
                    ))}
                  </select>
                </div>

                {/* Graded File Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Graded Submission File
                  </label>
                  <select
                    value={selectedGradedFile}
                    onChange={(e) => setSelectedGradedFile(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">No graded file</option>
                    {folderFiles.map(file => (
                      <option key={file.id} value={file.id}>{file.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 mb-4">
                <p className="text-xs text-blue-700">
                  Note: You can provide a score, attach files, or both. At least one must be provided.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleGradeSubmission}
                  className="flex-1 bg-orange-400 text-white py-2 rounded-lg hover:bg-orange-500 transition"
                >
                  Submit Grade
                </button>
                <button
                  onClick={() => {
                    setGradeModalData(null);
                    setGradeScore('');
                    setSelectedSolutionFile('');
                    setSelectedGradedFile('');
                    setFolderFiles([]);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default TeacherDashboard;