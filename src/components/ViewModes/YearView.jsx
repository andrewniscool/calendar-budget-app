import React from "react";
import dayjs from "dayjs";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function YearView({ setSelectedDate, setViewMode, selectedDate }) {
  const year = selectedDate ? dayjs(selectedDate).year() : dayjs().year();
  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).year(year));

  const generateMonthGrid = (monthStart) => {
    const daysInMonth = monthStart.daysInMonth();
    const startDay = monthStart.startOf("month").day();
    const grid = [];

    for (let i = 0; i < startDay; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push(dayjs(monthStart).date(i));
    }

    return grid;
  };

  return (
    <div className="w-full px-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-4 gap-y-4">
        {months.map((month, idx) => (
          <div key={idx} className="rounded p-2">
            <button
              className="text-sm font-semibold mb-1 text-slate-900 hover:text-slate-500 transition-colors duration-150"
              onClick={ () => {
                  setSelectedDate(month.startOf("month"));
                  setViewMode("month");
                }
              }
            >
              {month.format("MMMM")}
            </button>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
              {daysOfWeek.map((d) => (
                <div
                  key={d}
                  className={`w-[24px] h-[18px] sm:w-[28px] md:w-[32px] text-[10px] sm:text-[11px] md:text-[13px] text-slate-400 rounded-full flex items-center justify-center`}
                >
                  {d[0]}
                </div>
              ))}
            </div>

            {/* Day buttons */}
            <div className="grid grid-cols-7 gap-y-[5px] gap-x-[2px]">
              {generateMonthGrid(month).map((day, i) => {
                if (!day) {
                  return (
                    <div
                      key={i}
                      className="w-[24px] h-[18px] sm:w-[28px] md:w-[32px] text-[10px] sm:text-[11px] md:text-[13px] rounded-full opacity-0 pointer-events-none"
                    >
                      .
                    </div>
                  );
                }

                const isToday = day.isSame(dayjs(), "day");
                const isSelected = day.isSame(dayjs(selectedDate), "day");

                let className =
                  "w-[28px] h-[28px] text-[12px] rounded-full flex items-center justify-center transition-colors duration-150 ";

                if (isToday) {
                  className += "bg-slate-900 text-white font-semibold hover:bg-slate-700";
                } else if (isSelected) {
                  className += "bg-slate-200 text-slate-900 font-medium hover:bg-slate-300";
                } else {
                  className += "text-slate-600 hover:bg-slate-100";
                }

                return (
                  <button
                    key={i}
                    className={className}
                    onClick={() => {
                      setSelectedDate(day);
                      setViewMode("day");
                    }}
                  >
                    {day.date()}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YearView;
