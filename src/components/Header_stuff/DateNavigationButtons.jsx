import React from "react";
import dayjs from "dayjs";

function DateNavigationButtons({ viewMode, selectedDate, setSelectedDate }) {
  const handlePrevious = () => {
    const current = dayjs(selectedDate);
    let newDate;

    switch (viewMode) {
      case "day":
        newDate = current.subtract(1, "day");
        break;
      case "week":
        newDate = current.subtract(1, "week");
        break;
      case "month":
        newDate = current.subtract(1, "month");
        break;
      case "year":
        newDate = current.subtract(1, "year");
        break;
      default:
        newDate = current;
    }

    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const current = dayjs(selectedDate);
    let newDate;

    switch (viewMode) {
      case "day":
        newDate = current.add(1, "day");
        break;
      case "week":
        newDate = current.add(1, "week");
        break;
      case "month":
        newDate = current.add(1, "month");
        break;
      case "year":
        newDate = current.add(1, "year");
        break;
      default:
        newDate = current;
    }

    setSelectedDate(newDate);
  };

  const getCurrentPeriodLabel = () => {
    const current = dayjs(selectedDate);

    switch (viewMode) {
      case "day":
        return current.format("dddd, MMMM D, YYYY");
      case "week": {
        const startOfWeek = current.startOf("week");
        const endOfWeek = current.endOf("week");
        if (startOfWeek.month() === endOfWeek.month()) {
          return `${startOfWeek.format("MMMM")} ${endOfWeek.format("YYYY")}`;
        } else {
          return `${startOfWeek.format("MMM")} – ${endOfWeek.format("MMM YYYY")}`;
        }
      }
      case "month":
        return current.format("MMMM YYYY");
      case "year":
        return current.format("YYYY");
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handlePrevious}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Previous"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Next"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <span className="whitespace-nowrap px-1.5 text-sm font-semibold text-slate-900">
        {getCurrentPeriodLabel()}
      </span>
    </div>
  );
}

export default DateNavigationButtons;
