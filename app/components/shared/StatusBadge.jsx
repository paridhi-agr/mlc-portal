const STATUS_CONFIG = {
    assigned:        { label: "Assigned", cls: "bg-blue-50 text-blue-700" },
    overdue:         { label: "Overdue",  cls: "bg-red-50 text-red-700" },
    graded:          { label: "Graded",   cls: "bg-emerald-50 text-emerald-700" },
    late_submission: { label: "Late Submission",     cls: "bg-orange-50 text-orange-700" },
  };
  
  export function StatusBadge({ status }) {
    const { label, cls } = STATUS_CONFIG[status] ?? STATUS_CONFIG.assigned;
    return (
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cls}`}>
        {label}
      </span>
    );
  }