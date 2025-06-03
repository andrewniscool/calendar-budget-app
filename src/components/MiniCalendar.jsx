import { useState } from "react";
import dayjs from "dayjs";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

function MiniCalendar() {
  const today = dayjs();
  const [currentMonth] = useState(today.startOf("month"));

  const daysInMonth = currentMonth.daysInMonth();
  const startDay = currentMonth.startOf("month").day(); // Sunday = 0

  const daysArray = [];

  // Fill with empty slots before the 1st
  for (let i = 0; i < startDay; i++) {
    daysArray.push(null);
  }

  // Fill the rest of the month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(currentMonth.date(i));
  }

  return (
    <div className="rounded-lg p-1 max-w-xs mx-auto"> 
        <div className="flex items-center mb-2">
            <h3 className="text-left pl-2 text-sm font-semibold mb-2">
                {currentMonth.format("MMMM YYYY")}
            </h3>
            <button className="ml-auto text-gray-500 hover:text-gray-700">
                ◀
            </button>
            <button className="text-gray-500 hover:text-gray-700">
                ▶
            </button>
        </div>

      <div className=" grid grid-cols-7 gap-1 text-[10px] text-left pl-2 font-medium text-gray-500 mb-2">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-left pl-1">
        {daysArray.map((day, i) => {
          const isToday = day?.isSame(today, "day");
          return (
            <div
              key={i}
              className={`p-1 rounded ${
                isToday
                  ? "bg-blue-600 text-white font-bold"
                  : "text-gray-800"
              }`}
            >
              {day ? day.date() : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MiniCalendar;
