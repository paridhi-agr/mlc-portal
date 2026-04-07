"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { X, ClipboardList, FileText, Download, CheckCircle } from "lucide-react";
import { AppNav } from "./shared/AppNav";
import { SidebarContent } from "./shared/BatchSidebar";
import { StatusBadge } from "./shared/StatusBadge";
import { ScoreRing } from "./shared/ScoreRing";
import { computeBatchAverage } from "@/lib/scoreUtil";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avgScore(assignments) {
  return computeBatchAverage(assignments)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Assignment row card ──────────────────────────────────────────────────────

const AssignmentRow = React.memo(function AssignmentRow({ assignment }) {
  const isGraded = assignment.status === "graded" || assignment.status === "late_submission";
  const isAssigned = assignment.status === "assigned";
  const isOverdue = assignment.status === "overdue";

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2
      ${isAssigned ? "border-l-[3px] border-l-orange-400" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-medium text-gray-900 leading-snug">{assignment.worksheetName}</p>
            <StatusBadge status={assignment.status} />
          </div>
          <p className="text-[11px] text-gray-400">Due {formatDate(assignment.dueDate)}</p>
        </div>
        {isGraded && assignment.score != null && <ScoreRing score={assignment.score} maxScore={assignment.maxScore} />}
      </div>

      {/* File links */}
      <div className="flex flex-wrap gap-4">
        <a
          href={`https://drive.google.com/file/d/${assignment.worksheetFileId}/view`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 hover:underline"
        >
          <FileText className="w-3 h-3" /> View assignment
        </a>
        {assignment.solutionFileId && (
        <a
            href={`https://drive.google.com/file/d/${assignment.solutionFileId}/view`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            <Download className="w-3 h-3" /> Solution
          </a>
        )}
        {assignment.gradedFileId && (
          <a
            href={`https://drive.google.com/file/d/${assignment.gradedFileId}/view`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 hover:underline"
          >
            <CheckCircle className="w-3 h-3" /> Graded file
          </a>
        )}
      </div>

      {isAssigned && (
        <p className="text-[11px] text-gray-400">
          Email to <span className="font-medium text-gray-600">hwbymlc@gmail.com</span> with your name and assignment number in the subject.
        </p>
      )}
      {isOverdue && (
        <div className="bg-red-50 border border-red-100 rounded px-3 py-1.5 text-xs text-red-700 font-medium">
          This assignment is overdue
        </div>
      )}
    </div>
  );
});

// ─── Main dashboard ───────────────────────────────────────────────────────────

const StudentDashboard = ({ session }) => {
  const [batches, setBatches] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/batches");
      const data = await res.json();
      const fetched = data.batches || [];
      setBatches(fetched);
      if (fetched.length) {
        setActiveBatch((prev) => {
          if (prev) return fetched.find((b) => b.id === prev.id) || fetched[0];
          return fetched.find((b) => b.isActive) || fetched[0];
        });
      }
    } catch (e) {
      console.error("Error fetching batches:", e);
    }
  }, []);

  const fetchAssignments = useCallback(async (batch) => {
    if (!batch) {setLoadingData(false);return};
    setLoadingData(true);
    try {
      const res = await fetch(`/api/assignments?batchId=${batch.id}`);
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (e) {
      console.error("Error fetching assignments:", e);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);
  useEffect(() => {
    setAssignments([]);
    fetchAssignments(activeBatch);
  }, [activeBatch?.id, fetchAssignments]);

  const handleSelectBatch = useCallback((batch) => {
    setActiveBatch(batch);
    setSidebarOpen(false);
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────

  const { submittedCount, totalCount, overdueCount, avg } = useMemo(() => {
    const submittedCount = assignments.filter(
      (a) => a.status === "graded" || a.status === "late_submission"
    ).length;
    const totalCount = assignments.length;
    const overdueCount = assignments.filter((a) => a.status === "overdue").length;
    const avg = avgScore(assignments);
    return { submittedCount, totalCount, overdueCount, avg };
  }, [assignments]);

  const isHistoric = activeBatch ? !activeBatch.isActive : false;
  const liveBatch = useMemo(() => batches.find((b) => b.isActive), [batches]);

  const sidebarProps = {
    batches,
    activeBatch,
    liveBatch,
    onSelectBatch: handleSelectBatch,
    onNewBatch: null, // students can't create batches
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <AppNav session={session} onMenuClick={() => setSidebarOpen((o) => !o)} />

      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 min-h-0">

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-52 shrink-0 bg-[#fdf8eb] border-r border-amber-100 flex-col">
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Mobile drawer */}
        <aside className={`fixed top-0 left-0 h-full w-64 bg-[#fdf8eb] border-r border-amber-100 flex flex-col z-40
          transform transition-transform duration-200 ease-in-out md:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
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

          {/* Content header */}
          {activeBatch ? (<header className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-gray-200 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-medium text-gray-900">
                  {activeBatch?.name ?? "My assignments"}
                </h1>
                {isHistoric && (
                  <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                    Read only
                  </span>
                )}
              </div>
              {/* <p className="text-xs text-gray-400 mt-0.5">
                Welcome back, {firstName}
              </p> */}
            </div>
          </header>) :(<></>)}
          

          <main className="flex-1 overflow-y-auto px-4 md:px-6 py-5 flex flex-col gap-5">
            {loadingData ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !activeBatch ? (
              <div className="flex flex-col items-center justify-center h-full py-20 gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">You're not enrolled in a batch yet</p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Your teacher will add you to a batch soon. Once enrolled, your assignments will appear here.
                  </p>
                </div>
                <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 max-w-xs">
                  <p className="text-xs text-amber-800">
                    If you think this is a mistake, reach out to your teacher at{" "}
                    <span className="font-medium">infobymlc@gmail.com</span>
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Stats bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Assignments",   value: totalCount },
                    { label: "Submitted",     value: submittedCount },
                    { label: "Overdue",       value: overdueCount },
                    { label: "Avg. score",    value: avg !== null ? `${avg}%` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-lg px-4 py-3">
                      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
                      <p className="text-xl font-medium text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Assignment list */}
                <div className={`bg-white border border-gray-100 rounded-xl p-4 md:p-5 ${assignments.length > 0 ? 'grid grid-cols-2 gap-3' : ''}`}>
                  {assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <ClipboardList className="w-10 h-10 text-gray-300" />
                      <p className="text-sm text-gray-400">No assignments in this batch</p>
                    </div>
                  ) : (
                    assignments
                      .slice()
                      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
                      .map((a) => <AssignmentRow key={a.id} assignment={a} />)
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;