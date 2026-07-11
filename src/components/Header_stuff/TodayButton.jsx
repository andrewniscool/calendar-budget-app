import React from "react";
import dayjs from "dayjs";

function TodayButton({ setSelectedDate, children }) {
  return (
    <button
      onClick={() => setSelectedDate(dayjs())}
      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      {children || "Today"}
    </button>
  );
}

export default TodayButton;
