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
<div className="w-64 bg-white shadow-md p-4 space-y-6 overflow-y-auto sticky top-0 h-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100" style={{scrollbarGutter: 'stable'}}>      <BudgetDashboard
        events={events}
        categories={categories}
        selectedDate={selectedDate}
        viewMode={viewMode}
        budgetLimits={budgetLimits}
        setBudgetLimits={setBudgetLimits}
      />

      {/* Add Event Button */}
      <button
        onClick={onAddEventClick}
        className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 transition"
      >
        + Add Event
      </button>

      {/* Mini Calendar Section */}
      <MiniCalendar
        onDateClick={(date) => {
          setSelectedDate(date);
          setViewMode("day");
        }}
        viewMode={viewMode}
        selectedDate={selectedDate}
      />

      {/* Category Manager Section */}
      <CategoryManager
        categories={categories}
        setCategories={setCategories}
        calendarId = {calendarId}
      />

    </div>
  );
}

export default Sidebar;
