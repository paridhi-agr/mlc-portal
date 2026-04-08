'use client';
import { X, Plus } from "lucide-react";
import { AppNav } from "./shared/AppNav";
import { SidebarContent } from "./shared/BatchSidebar";
import { StatusBadge } from "./shared/StatusBadge";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { computeBatchAverage } from "@/lib/scoreUtil";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAssignmentStatus(assignment) {
  const due = new Date(assignment.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (assignment.gradedFileId) {
    const sub = new Date(assignment.submissionReceivedDate);
    return sub <= due ? "graded" : "late_submission";
  }
  return due >= today ? "assigned" : "overdue";
}

function avgScore(assignments) {
  return computeBatchAverage(assignments);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Assignment card ──────────────────────────────────────────────────────────
// Wrapped in React.memo so it only re-renders when its own props change.

const AssignmentCard = React.memo(function AssignmentCard({ assignment, isHistoric, onGrade }) {
  const status = getAssignmentStatus(assignment);
  const gradeActive = !isHistoric && (status === "assigned" || status === "overdue");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2 min-w-0">
      <div>
        <p className="text-sm font-medium text-gray-900 leading-snug">{assignment.worksheetName}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Due {formatDate(assignment.dueDate)}</p>
      </div>
      {assignment.score !== null && assignment.score !== undefined && (
        <p className="text-sm font-medium text-amber-800">{assignment.score}/{assignment.maxScore}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-1">
        <StatusBadge status={status} />
        <button
          onClick={() => gradeActive && onGrade(assignment)}
          disabled={!gradeActive}
          className={`text-[11px] font-medium px-2.5 py-1 rounded border transition-colors
            ${gradeActive
              ? "border-orange-400 text-orange-500 hover:bg-orange-50 cursor-pointer"
              : "border-gray-200 text-gray-300 cursor-not-allowed"
            }`}
        >
          Grade
        </button>
      </div>
    </div>
  );
});

// ─── Student tabs panel ───────────────────────────────────────────────────────

const StudentPanel = React.memo(function StudentPanel({ students, batchId, isHistoric, onGrade }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const prevBatchId = useRef(batchId);

  // Only reset to first student when the batch changes, not on every render
  useEffect(() => {
    if (prevBatchId.current !== batchId) {
      prevBatchId.current = batchId;
      setActiveIdx(0);
    }
  }, [batchId]);

  if (!students.length) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">
        No students enrolled in this batch yet.
      </p>
    );
  }

  // Guard against activeIdx pointing past end of list (e.g. after batch switch)
  const safeIdx = Math.min(activeIdx, students.length - 1);
  const student = students[safeIdx];
  const avg = avgScore(student.assignments);

  return (
    <div className="flex flex-col gap-4">
      {/* Student name tabs */}
      <div className="flex flex-wrap gap-2">
        {students.map((s, i) => {
          const sAvg = avgScore(s.assignments);
          const isActive = i === safeIdx;
          return (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                ${isActive
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-amber-50 text-orange-500 border-orange-300 hover:bg-orange-50"
                }`}
            >
              {s.name}
              {sAvg !== null && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium
                  ${isActive ? "bg-white/25 text-white" : "bg-orange-100 text-orange-600"}`}>
                  {sAvg}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active student info */}
      <div className="flex items-center gap-3">
        {student.image && (
          <img src={student.image} alt={student.name} className="w-8 h-8 rounded-full" />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">{student.name}</p>
          <p className="text-xs text-gray-400">{student.email}</p>
        </div>
        {avg !== null && (
          <span className="ml-auto text-sm font-medium text-amber-800 bg-amber-50 px-3 py-1 rounded-full">
            {avg}% avg
          </span>
        )}
      </div>

      {/* Assignment cards */}
      {student.assignments.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No assignments yet for this student.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {student.assignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} isHistoric={isHistoric} onGrade={onGrade} />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Grade modal ──────────────────────────────────────────────────────────────

function GradeModal({ assignment, folderFiles, loadingFiles, onClose, onSubmit }) {
  const [score, setScore] = useState("");
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split("T")[0]);
  const [solutionFile, setSolutionFile] = useState("");
  const [gradedFile, setGradedFile] = useState("");

  function handleSubmit() {
    const hasScore = score !== "" && Number(score) >= 0 && Number(score) <= 100;
    const hasFiles = solutionFile && gradedFile;
    if (!submissionDate) { alert("Submission received date is required."); return; }
    if (!hasScore && !hasFiles) {
      alert("Please enter a score (0–100) or select both solution and graded files.");
      return;
    }
    const safeDate = new Date(submissionDate);
    safeDate.setUTCHours(12, 0, 0, 0);
    onSubmit({
      assignmentId: assignment.id,
      action: "grade",
      submissionReceivedDate: safeDate.toISOString(),
      ...(hasScore && { score: parseInt(score) }),
      ...(solutionFile && { solutionFileId: solutionFile }),
      ...(gradedFile && { gradedFileId: gradedFile }),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-medium text-gray-900">Grade submission</h2>
            <p className="text-sm text-orange-500 mt-0.5">{assignment.worksheetName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{assignment.student?.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Submission received date <span className="text-red-400">*</span></span>
            <input type="date" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Score (1 to {assignment.maxScore})</span>
            <input type="number" min="1" max={assignment.maxScore} value={score} onChange={(e) => setScore(e.target.value)}
              placeholder="Leave blank if not scoring yet"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Solution file</span>
            <select value={solutionFile} onChange={(e) => setSolutionFile(e.target.value)}
              disabled={loadingFiles}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 disabled:opacity-50">
              <option value="">No solution file</option>
              {folderFiles.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Graded submission file</span>
            <select value={gradedFile} onChange={(e) => setGradedFile(e.target.value)}
              disabled={loadingFiles}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 disabled:opacity-50">
              <option value="">No graded file</option>
              {folderFiles.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-700">
            Enter the date the student emailed their homework. The system will automatically detect
            late submissions. Provide a score, both files, or all three.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Submit grade
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign modal ─────────────────────────────────────────────────────────────

function AssignModal({ batch, assignmentFolders, onClose, onSubmit }) {
  const batchStudents = batch.students || [];
  const [selectedStudents, setSelectedStudents] = useState(batchStudents.map((s) => s.id));
  const [selectedFolder, setSelectedFolder] = useState("");
  const [folderFiles, setFolderFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [maxScore, setMaxScore] = useState(25);

  async function handleFolderChange(folderId) {
    setSelectedFolder(folderId);
    setSelectedFile("");
    setFolderFiles([]);
    if (!folderId) return;
    try {
      const res = await fetch(`/api/drive?action=listFiles&folderId=${folderId}`);
      const data = await res.json();
      setFolderFiles(data.files || []);
    } catch (e) {
      console.error("Error fetching folder files:", e);
    }
  }

  function toggleStudent(id) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    if (!selectedFolder || !selectedFile || !dueDate || !selectedStudents.length) {
      alert("Please fill in all required fields and select at least one student.");
      return;
    }
    const folder = assignmentFolders.find((f) => f.id === selectedFolder);
    const file = folderFiles.find((f) => f.id === selectedFile);
    const safeDueDate = new Date(dueDate);
    safeDueDate.setUTCHours(12, 0, 0, 0);
    onSubmit({
      batchId: batch.id,
      studentIds: selectedStudents,
      worksheetName: folder.name,
      worksheetDescription: description,
      worksheetFolderId: selectedFolder,
      worksheetFileId: selectedFile,
      worksheetFileName: file.name,
      solutionFileId: null,
      dueDate: safeDueDate,
      maxScore: Number(maxScore),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-gray-900">Assign homework</h2>
            <p className="text-xs text-orange-500 mt-0.5">{batch.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Assign to <span className="text-red-400">*</span></span>
            <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input type="checkbox"
                  checked={selectedStudents.length === batchStudents.length && batchStudents.length > 0}
                  onChange={(e) => setSelectedStudents(e.target.checked ? batchStudents.map((s) => s.id) : [])}
                  className="w-4 h-4 accent-orange-500" />
                All students in batch
              </label>
              <div className="border-t border-gray-100 pt-2 flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {batchStudents.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={selectedStudents.includes(s.id)}
                      onChange={() => toggleStudent(s.id)} className="w-4 h-4 accent-orange-500" />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Assignment folder <span className="text-red-400">*</span></span>
            <select value={selectedFolder} onChange={(e) => handleFolderChange(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
              <option value="">Choose a folder</option>
              {assignmentFolders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
          {selectedFolder && folderFiles.length > 0 && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Assignment file <span className="text-red-400">*</span></span>
              <select value={selectedFile} onChange={(e) => setSelectedFile(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                <option value="">Choose a file</option>
                {folderFiles.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Description (optional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Assignment instructions or notes..." rows={2}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Due date <span className="text-red-400">*</span></span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Max Score <span className="text-red-400">*</span></span>
            <input type="number" min="1" value={maxScore} onChange={(e) => setMaxScore(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              placeholder="Maximum score possible for this assignment" required />
          </label>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600">Assign</button>
        </div>
      </div>
    </div>
  );
}

// ─── Create batch modal ───────────────────────────────────────────────────────

function CreateBatchModal({ allStudents, onClose, onCreated }) {
  const [batchName, setBatchName] = useState("");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [setActive, setSetActive] = useState(false);
  const [selectedExisting, setSelectedExisting] = useState([]);
  const [newStudents, setNewStudents] = useState([{ name: "", email: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleExisting(id) {
    setSelectedExisting((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  function updateNew(i, field, value) {
    const copy = [...newStudents];
    copy[i][field] = value;
    setNewStudents(copy);
  }

  async function handleCreate() {
    setError("");
    if (!batchName.trim()) { setError("Batch name is required."); return; }
    if (!driveFolderId.trim()) { setError("Google Drive folder ID is required."); return; }
    const validNewStudents = newStudents.filter((s) => s.email.trim());
    setSaving(true);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: batchName.trim(),
          driveFolderId: driveFolderId.trim(),
          setActive,
          existingStudentIds: selectedExisting,
          newStudents: validNewStudents,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create batch."); }
      const { batch } = await res.json();
      onCreated(batch);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-gray-900">Create new batch</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Batch name <span className="text-red-400">*</span></span>
            <input type="text" value={batchName} onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g. Q2 2026"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Google Drive folder ID <span className="text-red-400">*</span></span>
            <input type="text" value={driveFolderId} onChange={(e) => setDriveFolderId(e.target.value)}
              placeholder="Paste the folder ID from Drive"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 font-mono" />
            <span className="text-[11px] text-gray-400">
              Found in the Drive URL: drive.google.com/drive/folders/<strong>folder-id</strong>
            </span>
          </label>
          <label className="flex items-center gap-2.5 px-3 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={setActive} onChange={(e) => setSetActive(e.target.checked)}
              className="w-4 h-4 accent-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Set as live batch</p>
              <p className="text-[11px] text-gray-400">Makes this the current batch. Previous live batch becomes read-only.</p>
            </div>
          </label>
          {allStudents.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Enroll existing students</span>
              <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {allStudents.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={selectedExisting.includes(s.id)}
                      onChange={() => toggleExisting(s.id)} className="w-4 h-4 accent-orange-500" />
                    <span>{s.name}</span>
                    <span className="text-gray-400 text-xs ml-auto">{s.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-gray-500">Add new students</span>
            {newStudents.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={s.name} onChange={(e) => updateNew(i, "name", e.target.value)}
                  placeholder="Name"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                <input type="email" value={s.email} onChange={(e) => updateNew(i, "email", e.target.value)}
                  placeholder="Google account email"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                {newStudents.length > 1 && (
                  <button onClick={() => setNewStudents(newStudents.filter((_, idx) => idx !== i))}
                    className="text-gray-300 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setNewStudents([...newStudents, { name: "", email: "" }])}
              className="self-start flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium">
              <Plus className="w-3.5 h-3.5" /> Add another student
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
            {saving ? "Creating…" : "Create batch"}
          </button>
        </div>
      </div>
    </div>
  );
}

//--- Add Student Modal ------------
function AddStudentModal({ enrolledStudentIds, onClose, onAdd }) {
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  useEffect(() => {
    async function fetchAllStudents() {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        setAllStudents(data.students || []);
      } catch (e) {
        console.error('Error fetching students:', e);
      } finally {
        setLoadingStudents(false);
      }
    }
    fetchAllStudents();
  }, []);

  const unenrolled = allStudents.filter(
    (s) =>
      !enrolledStudentIds.includes(s.id) &&
      (s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAdd(studentId) {
    setAdding(studentId);
    await onAdd(studentId);
    setAdding(null);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-medium text-gray-900">Add student to batch</h2>
            <p className="text-xs text-gray-400 mt-0.5">Only students not yet in this batch are shown</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 w-full"
          autoFocus
        />

        <div className="flex flex-col gap-2">
          {loadingStudents ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : unenrolled.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {search ? 'No matching students found' : 'All registered students are already enrolled in this batch'}
            </p>
          ) : (
            unenrolled.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {s.image ? (
                    <img src={s.image} alt={s.name} className="w-7 h-7 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {s.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(s.id)}
                  disabled={adding === s.id}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {adding === s.id ? 'Adding…' : 'Add'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Main dashboard ───────────────────────────────────────────────────────────

const TeacherDashboard = ({ session }) => {
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentFolders, setAssignmentFolders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeBatch, setActiveBatch] = useState(null);

  // Mobile sidebar drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [gradeModalAssignment, setGradeModalAssignment] = useState(null);
  const [gradeFolderFiles, setGradeFolderFiles] = useState([]);
  const [loadingGradeFiles, setLoadingGradeFiles] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // ── Fetch batches ──────────────────────────────────────────────────────────

  const fetchBatches = useCallback(async (selectBatchId = null) => {
    try {
      const res = await fetch("/api/batches");
      const data = await res.json();
      const fetched = data.batches || [];
      setBatches(fetched);

      const seen = new Set();
      const all = [];
      for (const batch of fetched) {
        for (const student of batch.students || []) {
          if (!seen.has(student.id)) { seen.add(student.id); all.push(student); }
        }
      }
      setAllStudents(all);

      if (fetched.length) {
        if (selectBatchId) {
          setActiveBatch(fetched.find((b) => b.id === selectBatchId) || fetched[0]);
        } else {
          // Keep existing selection stable — use functional update to read current value
          setActiveBatch((prev) => {
            if (prev) return fetched.find((b) => b.id === prev.id) || fetched[0];
            return fetched.find((b) => b.isActive) || fetched[0];
          });
        }
      }
    } catch (e) {
      console.error("Error fetching batches:", e);
    }
  }, []);

  // ── Fetch assignments + Drive folders ──────────────────────────────────────

  const fetchBatchData = useCallback(async (batch) => {
    if (!batch) return;
    setLoadingData(true);
    try {
      const [aRes, fRes] = await Promise.all([
        fetch(`/api/assignments?batchId=${batch.id}`),
        fetch(`/api/drive?action=listFolders&rootFolderId=${batch.driveFolderId}`),
      ]);
      const aData = await aRes.json();
      const fData = await fRes.json();
      setAssignments(aData.assignments || []);
      setAssignmentFolders(fData.folders || []);
    } catch (e) {
      console.error("Error fetching batch data:", e);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  useEffect(() => {
    setAssignments([]);
    setAssignmentFolders([]);
    fetchBatchData(activeBatch);
  }, [activeBatch?.id, fetchBatchData]);

  // ── Grade modal ────────────────────────────────────────────────────────────

  // useCallback so AssignmentCard/StudentPanel don't re-render when grade modal
  // state (gradeModalAssignment, gradeFolderFiles, loadingGradeFiles) changes
  const openGradeModal = useCallback(async (assignment) => {
    setGradeModalAssignment(assignment);
    setGradeFolderFiles([]);
    if (assignment.worksheetFolderId) {
      setLoadingGradeFiles(true);
      try {
        const res = await fetch(`/api/drive?action=listFiles&folderId=${assignment.worksheetFolderId}`);
        const data = await res.json();
        setGradeFolderFiles(data.files || []);
      } catch (e) {
        console.error("Error fetching folder files:", e);
      } finally {
        setLoadingGradeFiles(false);
      }
    }
  }, []); // no deps — uses no outer state, only setters (stable)

  const handleGradeSubmit = useCallback(async (payload) => {
    try {
      const res = await fetch("/api/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setGradeModalAssignment(null);
        setGradeFolderFiles([]);
        // Re-fetch only assignments, not batches — preserves student tab position
        setActiveBatch((prev) => {
          if (prev) fetchBatchData(prev);
          return prev;
        });
      }
    } catch (e) {
      console.error("Error grading submission:", e);
    }
  }, [fetchBatchData]);

  const handleAssignSubmit = useCallback(async (payload) => {
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowAssignModal(false);
        setActiveBatch((prev) => {
          if (prev) fetchBatchData(prev);
          return prev;
        });
      }
    } catch (e) {
      console.error("Error assigning homework:", e);
    }
  }, [fetchBatchData]);

  const handleSelectBatch = useCallback((batch) => {
    setActiveBatch(batch);
    setSidebarOpen(false); // close drawer on mobile after selection
  }, []);

  const handleAddStudentToBatch = useCallback(async (studentId) => {
    if (!activeBatch) return;
    try {
      const res = await fetch('/api/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: activeBatch.id, studentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to add student');
        return;
      }
      setShowAddStudentModal(false);
      fetchBatches(); // refresh so sidebar + studentsInBatch update
    } catch (e) {
      console.error('Error adding student to batch:', e);
    }
  }, [activeBatch, fetchBatches]);

  // ── Derived — memoised so references are stable across unrelated renders ───

  // studentsInBatch only recomputes when activeBatch.students or assignments change.
  // This prevents StudentPanel's batchId-ref effect from firing spuriously.
  const studentsInBatch = useMemo(() => {
    return (activeBatch?.students || []).map((s) => ({
      ...s,
      assignments: assignments
        .filter((a) => a.studentId === s.id)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    }));
  }, [activeBatch?.students, assignments]);

  const { gradedCount, overdueCount, avgAll } = useMemo(() => {
    const gradedAssignments = assignments.filter(a => a.score != null);

    const gradedCount = assignments.filter(a => a.gradedFileId).length;

    const overdueCount = assignments.filter(
      (a) => getAssignmentStatus(a) === "overdue"
    ).length;

    // ⭐ normalize scores before averaging
    const percentages = gradedAssignments.map(a =>
      a.score / a.maxScore
    );

    const avgAll = percentages.length
      ? Math.round(
        (percentages.reduce((sum, p) => sum + p, 0) / percentages.length) * 100
      ) + "%"
      : "—";

    return { gradedCount, overdueCount, avgAll };
  }, [assignments]);

  const isHistoric = activeBatch ? !activeBatch.isActive : false;
  const liveBatch = useMemo(() => batches.find((b) => b.isActive), [batches]);

  const sidebarProps = {
    batches,
    activeBatch,
    liveBatch,
    onSelectBatch: handleSelectBatch,
    onNewBatch: () => { setShowCreateBatch(true); setSidebarOpen(false); },
    role: "teacher"
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top nav */}
      <AppNav session={session} onMenuClick={() => setSidebarOpen((open) => !open)} />

      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar — always visible on md+ */}
        <aside className="hidden md:flex w-52 shrink-0 bg-[#fdf8eb] border-r border-amber-100 flex-col">
          
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Mobile drawer — slides in from left */}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-[#fdf8eb] border-r border-amber-100 flex flex-col z-40
            transform transition-transform duration-200 ease-in-out md:hidden
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Drawer header with close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-100">
            <span className="text-sm font-medium text-amber-900">Batches</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-gray-200 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-medium text-gray-900">
                  {activeBatch?.name ?? "Select a batch"}
                </h1>
                {isHistoric && (
                  <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                    Read only
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {studentsInBatch.length} student{studentsInBatch.length !== 1 ? "s" : ""}
                {" · "}{assignments.length} assignments
              </p>
            </div>
            {activeBatch && !isHistoric && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-white border border-orange-300 text-orange-500 text-sm font-medium rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add student</span>
                  <span className="sm:hidden">Add</span>
                </button>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Assign homework</span>
                  <span className="sm:hidden">Assign</span>
                </button>
              </div>
            )}
          </header>

          <main className="flex-1 overflow-y-auto px-4 md:px-6 py-5 flex flex-col gap-5">
            {loadingData ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !activeBatch ? (
              <div className="flex items-center justify-center h-40 bg-white rounded-xl border border-gray-100 text-sm text-gray-400">
                Create a batch to get started.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Students", value: studentsInBatch.length },
                    { label: "Assignments graded", value: gradedCount },
                    { label: "Overdue", value: overdueCount },
                    { label: "Avg. score", value: avgAll },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-lg px-4 py-3">
                      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
                      <p className="text-xl font-medium text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4 md:p-5">
                  <StudentPanel
                    students={studentsInBatch}
                    batchId={activeBatch.id}
                    isHistoric={isHistoric}
                    onGrade={openGradeModal}
                  />
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modals */}
      {gradeModalAssignment && (
        <GradeModal
          assignment={gradeModalAssignment}
          folderFiles={gradeFolderFiles}
          loadingFiles={loadingGradeFiles}
          onClose={() => { setGradeModalAssignment(null); setGradeFolderFiles([]); }}
          onSubmit={handleGradeSubmit}
        />
      )}

      {showAssignModal && activeBatch && (
        <AssignModal
          batch={activeBatch}
          assignmentFolders={assignmentFolders}
          onClose={() => setShowAssignModal(false)}
          onSubmit={handleAssignSubmit}
        />
      )}

      {showAddStudentModal && activeBatch && (
        <AddStudentModal
          enrolledStudentIds={(activeBatch.students || []).map((s) => s.id)}
          onClose={() => setShowAddStudentModal(false)}
          onAdd={handleAddStudentToBatch}
        />
      )}


      {showCreateBatch && (
        <CreateBatchModal
          allStudents={allStudents}
          onClose={() => setShowCreateBatch(false)}
          onCreated={(newBatch) => fetchBatches(newBatch.id)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;