import React from "react";
import dayjs from "dayjs";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function YearView({ setSelectedDate, setViewMode }) {
  const year = dayjs().year();
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
      <div className="grid grid-cols-4 gap-x-4 gap-y-4">
        {months.map((month, idx) => (
          <div key={idx} className="rounded p-2">
            <button
              className="text-sm font-semibold mb-1 transform text-gray-800 hover:text-gray-500 active:text-gray-400 duration-150"
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
                  className="w-[24px] h-[24px] text-[9px] text-gray-500 rounded-full flex items-center justify-center"
                >
                  {d[0]}
                </div>
              ))}
            </div>

            {/* Day buttons */}
            <div className="grid grid-cols-7 gap-y-[5px] gap-x-[2px]">
              {generateMonthGrid(month).map((day, i) =>
                day ? (
                  <button
                    key={i}
                    className={`w-[24px] h-[24px] text-[11px] rounded-full flex items-center justify-center
                      text-gray-800 hover:bg-blue-100 active:bg-blue-200 transition-all ${
                      day.isSame(dayjs(), "day")
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedDate(day);
                      setViewMode("day");
                    }}
                  >
                    {day.date()}
                  </button>
                ) : (
                  <div
                    key={i}
                    className="w-[24px] h-[24px] rounded-full opacity-0 pointer-events-none"
                  >
                    .
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YearView;
