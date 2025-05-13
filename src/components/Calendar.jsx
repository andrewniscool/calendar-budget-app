import { Fragment, useEffect, useState, useRef, useLayoutEffect } from "react";
import dayjs from "dayjs";
import EventModal from "./EventModal";



function getStartOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const standard = hour % 12 === 0 ? 12 : hour % 12;
  return `${standard} ${suffix}`;
}

function getTextColor(bgColor) {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 2), 16);
  const b = parseInt(hex.substring(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}

function Calendar({
  categories,
  events,
  editingEvent,
  setEditingEvent,
  isEventModalOpen,
  setIsEventModalOpen,
  setSelectedDay,
  selectedHour,
  setSelectedHour,
  onSaveEvent,
  onDeleteEvent,
  modalPosition,
  setModalPosition
}) {
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });
  const redLineContainerRef = useRef(null);
  const [calendarRect, setCalendarRect] = useState(null);

  const [currentTime, setCurrentTime] = useState(dayjs());
  const [rowHeight, setRowHeight] = useState(56); 

  useLayoutEffect(() => {
    const row = document.querySelector(".h-14");
    if (row) {
      setRowHeight(row.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(dayjs()), 10000);

    // Measure calendar grid layout for positioning the red line
    if (redLineContainerRef.current) {
      const rects = redLineContainerRef.current.querySelectorAll(".day-column");
      const todayIndex = weekDates.findIndex((d) => dayjs(d).isSame(dayjs(), "day"));
      if (rects[todayIndex]) {
        const cell = rects[todayIndex].getBoundingClientRect();
        const parent = redLineContainerRef.current.getBoundingClientRect();
        setCalendarRect({
          left: cell.left - parent.left,
          width: cell.width,
        });
      }
    }

  return () => clearInterval(interval);
}, [weekDates]);

  const totalMinutes = currentTime.hour() * 60 + currentTime.minute();
  const topPx = (totalMinutes / 60) * rowHeight;


  function handleTimeCellClick(dayIndex, hour, event) {
    setSelectedDay(dayIndex);
    setSelectedHour(hour);
    setEditingEvent(null);
    setIsEventModalOpen(true);

    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX - 300,
    });
  }

  function handleEventClick(event) {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  }

  return (
    <div className="relative flex-1 bg-white rounded-xl overflow-hidden shadow">
      {/* Header */}
      <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] bg-white sticky top-0 z-10 rounded-t-xl">
        <div className="bg-white" />
        {weekDates.map((date, index) => (
          <div key={index} className="p-2 text-center text-sm font-medium">
            {date.toLocaleDateString("default", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        ))}
      </div>

      {/* Scrollable Time Grid with Red Line */}
      <div
        ref={redLineContainerRef}
        className="overflow-y-auto max-h-[calc(100vh-200px)] relative"
      >
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))]">
          {Array.from({ length: 24 }, (_, hour) => (
            <Fragment key={hour}>
              <div className="border-t border-l pr-2 text-xs text-gray-500 bg-gray-50 h-14 flex items-start pt-1 justify-end">
                {formatHour(hour)}
              </div>

              {weekDates.map((day, dayIndex) => (
                <div
                  key={`${dayIndex}-${hour}`}
                  className="border-t border-l relative h-14 cursor-pointer day-column"
                  onClick={(e) => handleTimeCellClick(dayIndex, hour, e)}
                >
                  {/* Events go here */}
                </div>
              ))}
            </Fragment>
          ))}
        </div>

        {/* Red Line Rendered After the Grid */}
        {calendarRect && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              top: `${topPx}px`,
              left: `${calendarRect.left}px`,
              width: `${calendarRect.width}px`,
            }}
          >
            <div className="h-[2px] bg-red-500 w-[calc(100%-4px)] mx-auto" />
          </div>
        )}
      </div>
      

      {/* Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        setIsOpen={setIsEventModalOpen}
        onSave={onSaveEvent}
        onDelete={onDeleteEvent}
        editingEvent={editingEvent}
        categories={categories}
        selectedHour={selectedHour}
        modalPosition={modalPosition}
      />
    </div>
  );
}

export default Calendar;
