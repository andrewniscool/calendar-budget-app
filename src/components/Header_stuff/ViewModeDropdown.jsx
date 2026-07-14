import React from "react";

const MODES = ["day", "week", "month", "year"];

// Segmented control for switching calendar views.
function ViewModeDropdown({ viewMode, setViewMode }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
      {MODES.map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          aria-pressed={viewMode === mode}
          className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
            viewMode === mode
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

export default ViewModeDropdown;
