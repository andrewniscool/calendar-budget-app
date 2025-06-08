import { useState } from "react";
import dayjs from "dayjs";

function MiniCalendar({ onDateClick, viewMode }) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [viewedDate, setViewedDate] = useState(null); 


  const goToPrevMonth = () => setCurrentMonth(prev => prev.subtract(1, "month"));
  const goToNextMonth = () => setCurrentMonth(prev => prev.add(1, "month"));

  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const startDay = startOfMonth.day(); // 0 = Sunday

  const days = [];

  for (let i = 0; i < startDay; i++) {
    days.push(null); // Empty cells for padding
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(dayjs(currentMonth).date(i));
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">{currentMonth.format("MMMM YYYY")}</div>
        <div className="flex gap-1">
          <button
            onClick={goToPrevMonth}
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-shadow hover:bg-gray-100 hover:shadow-sm hover:shadow-gray-400 transition-all duration-500 ease-in-out active:scale-[.92] active:bg-gray-200"
          >
            &lt;
          </button>
          <button
            onClick={goToNextMonth}
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-shadow hover:bg-gray-100 hover:shadow-sm hover:shadow-gray-400 transition-all duration-500 ease-in-out active:scale-[.92] active:bg-gray-200"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-500 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-sm">
        {days.map((day, i) => {
          const isToday = day && day.isSame(dayjs(), "day");
          const isViewed = day && viewedDate && day.isSame(viewedDate, "day");


          let className = "aspect-square rounded-full flex items-center justify-center text-gray-700 transition-all duration-300 ease-in-out";

          if (isToday) {
            className += " bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 active:scale-[.92]";
          } else if (isViewed && viewMode === "day") {
            className += " bg-gray-200 text-black hover:bg-gray-300 active:bg-gray-400 active:scale-[.92]";
          } else {
            className += " hover:bg-gray-100 hover:shadow-sm active:bg-gray-200 active:scale-[.92]";
          }

          return (
            <button
              key={i}
              onClick={() => {
                if (day) {
                  setViewedDate(day); // ✅ Update internal state
                  onDateClick?.(day.format("YYYY-MM-DD")); // ✅ Optional chaining in case it's undefined
                }
              }}
              className={className}
            >
              {day ? day.date() : ""}
            </button>
          );
        })}

      </div>
    </div>
  );
}

export default MiniCalendar;