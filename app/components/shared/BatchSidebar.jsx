"use client";
import { Plus } from "lucide-react";

export function SidebarContent({ batches, activeBatch, liveBatch, onSelectBatch, onNewBatch }) {
  return (
    <>
      {onNewBatch && (
        <>
          <div className="px-3 pt-4 pb-2">
            <button
              onClick={onNewBatch}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-orange-300 text-orange-500 text-xs font-medium hover:bg-amber-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New batch
            </button>
          </div>
          <hr className="mx-3 border-amber-100" />
        </>
      )}
      {batches.length === 0 ? (
        <p className="text-xs text-gray-400 px-5 py-4">No batches yet</p>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {liveBatch && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] uppercase tracking-widest font-medium text-amber-600 px-2 mb-1">
                Current
              </p>
              <button
                onClick={() => onSelectBatch(liveBatch)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors
                  ${activeBatch?.id === liveBatch.id
                    ? "bg-orange-500 text-white"
                    : "text-amber-900 hover:bg-amber-100"}`}
              >
                <span className="text-sm font-medium">{liveBatch.name}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
                  ${activeBatch?.id === liveBatch.id
                    ? "bg-white/25 text-white"
                    : "bg-amber-100 text-amber-700"}`}>
                  Live
                </span>
              </button>
            </div>
          )}
          {batches.filter((b) => !b.isActive).length > 0 && (
            <>
              <hr className="mx-3 border-amber-100 my-1" />
              <div className="px-3 pb-3">
                <p className="text-[10px] uppercase tracking-widest font-medium text-amber-600 px-2 mb-1">
                  Past batches
                </p>
                <div className="flex flex-col gap-0.5">
                  {batches.filter((b) => !b.isActive).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onSelectBatch(b)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                        ${activeBatch?.id === b.id
                          ? "bg-orange-500 text-white font-medium"
                          : "text-amber-700 opacity-70 hover:bg-amber-100 hover:opacity-100"}`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}