import { useEffect, useState } from "react";
import dayjs from "dayjs";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function MiniCalendar({ onDateClick, selectedDate }) {
  const [viewMonth, setViewMonth] = useState(() => dayjs(selectedDate || undefined));

  // Follow the main calendar when the selected date changes elsewhere.
  useEffect(() => {
    if (selectedDate) setViewMonth(dayjs(selectedDate));
  }, [selectedDate]);

  const monthStart = viewMonth.startOf("month");
  const cells = [
    ...Array.from({ length: monthStart.day() }, () => null),
    ...Array.from({ length: viewMonth.daysInMonth() }, (_, i) => monthStart.date(i + 1)),
  ];

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="px-1 text-xs font-semibold text-slate-900">
          {viewMonth.format("MMMM YYYY")}
        </span>
        <div className="flex items-center">
          <button
            onClick={() => setViewMonth((m) => m.subtract(1, "month"))}
            aria-label="Previous month"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMonth((m) => m.add(1, "month"))}
            aria-label="Next month"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 justify-items-center gap-y-0.5">
        {WEEKDAY_INITIALS.map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="flex h-6 w-7 items-center justify-center text-[10px] font-semibold uppercase text-slate-400"
          >
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`blank-${i}`} className="h-7 w-7" />;
          const isToday = day.isSame(dayjs(), "day");
          const isSelected =
            !isToday && selectedDate && day.isSame(dayjs(selectedDate), "day");
          return (
            <button
              key={day.format("YYYY-MM-DD")}
              onClick={() => onDateClick?.(day.format("YYYY-MM-DD"))}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                isToday
                  ? "bg-slate-900 font-semibold text-white hover:bg-slate-700"
                  : isSelected
                  ? "bg-slate-200 font-medium text-slate-900 hover:bg-slate-300"
                  : "font-medium text-slate-600 hover:bg-slate-100"
              }`}
            >
              {day.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MiniCalendar;
