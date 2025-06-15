import React, {  useEffect, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import DayView from "./DayView";
import WeekView from "./WeekView";
import MonthView from "./MonthView";
import YearView from "./YearView";
import "../styles/transitions.css"; // Ensure you have the correct path to your CSS file
import dayjs from "dayjs";

function AnimatedViewSwitcher({
  viewMode,
  selectedDate,
  setViewMode,
  setSelectedDate,
  ...props
}) {
  const [prevDate, setPrevDate] = useState(selectedDate);
  const [direction, setDirection] = useState("forward");

  useEffect(() => {
    if (dayjs(selectedDate).isAfter(prevDate)) {
      setDirection("forward");
    } else if (dayjs(selectedDate).isBefore(prevDate)) {
      setDirection("backward");
    }
    setPrevDate(selectedDate);
  }, [selectedDate, prevDate]);

  const getViewComponent = () => {
    switch (viewMode) {
      case "day":
        return <DayView {...props} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
      case "week":
        return <WeekView {...props} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
      case "month":
        return <MonthView {...props} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
      case "year":
        return <YearView {...props} selectedDate={selectedDate} setSelectedDate={setSelectedDate} setViewMode={setViewMode} />;
      default:
        return null;
    }
  };

  return (
    <TransitionGroup className="relative w-full h-full overflow-hidden">
      <CSSTransition
        key={viewMode}
        timeout={300}
        classNames={direction === "forward" ? "slide-left" : "slide-right"}
      >
        <div className="absolute w-full h-full top-0 left-0">
          {getViewComponent()}
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
}

export default AnimatedViewSwitcher;
