import React from "react";
import BudgetDashboard from "../components/Budget_stuff/BudgetDashboard";
import CategoryManager from "./Sidebar_stuff/CategoryManager";
import MiniCalendar from "./Sidebar_stuff/MiniCalendar";

function Sidebar({
  calendarId,
  categories,
  setCategories,
  onAddEventClick,
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,
  events,
  budgetLimits,
  setBudgetLimits
}) {
  return (
    <aside
      className="sticky top-0 flex h-full w-64 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="p-3">
        <button
          onClick={onAddEventClick}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          New event
        </button>
      </div>

      <div className="px-3 pb-3">
        <MiniCalendar
          onDateClick={(date) => {
            setSelectedDate(date);
            setViewMode("day");
          }}
          viewMode={viewMode}
          selectedDate={selectedDate}
        />
      </div>

      <div className="border-t border-slate-200/60 px-3 py-3">
        <BudgetDashboard
          events={events}
          categories={categories}
          selectedDate={selectedDate}
          viewMode={viewMode}
          budgetLimits={budgetLimits}
          setBudgetLimits={setBudgetLimits}
        />
      </div>

      <div className="border-t border-slate-200/60 px-3 py-3">
        <CategoryManager
          categories={categories}
          setCategories={setCategories}
          calendarId={calendarId}
        />
      </div>
    </aside>
  );
}

export default Sidebar;
