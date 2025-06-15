import React from "react";
import dayjs from "dayjs";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";

import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowLeft } from "react-icons/md";

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
          return `${startOfWeek.format("MMM")} - ${endOfWeek.format("MMM YYYY")}`;
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
    <div className="flex items-center gap-2">


      <button
        onClick={handlePrevious}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-400 transition-colors duration-200"
        aria-label="Previous"
      >
        <svg 
          className="w-5 h-5 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 19l-7-7 7-7" 
          />
        </svg>
      </button>

      <button
        onClick={handleNext}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-400 transition-colors duration-300"
        aria-label="Next"
      >
        <svg 
          className="w-5 h-5 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </button>

      <div className="text-lg font-semibold text-gray-800 min-w-0 text-center px-2">
        {getCurrentPeriodLabel()}
      </div>

    </div>
  );
}

export default DateNavigationButtons;