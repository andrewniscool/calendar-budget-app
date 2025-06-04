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
  // console.log("Time received for getMinutes:", timeStr);  // Log the time value being passed to getMinutes
  if (timeStr === undefined) {
    console.error("Time is undefined");  // Log if time is undefined
    return 0;  // Return 0 if the input is invalid
  }
  
  else if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) {
    console.error("Invalid time format:", timeStr);  // Log if time is invalid
    return 0;  // Return 0 if the input is invalid
  }

  // Ensure the time is in HH:mm:ss format
  if (timeStr.length === 5) {
    timeStr += ":00";  // Add seconds if it's in HH:mm format (e.g., "14:00" becomes "14:00:00")
  }

  const [h, m, s] = timeStr.split(":").map(Number);  // Split and convert to numbers

  // Check if hour, minute, or second are NaN
  if (isNaN(h) || isNaN(m) || isNaN(s)) {
    console.error("Invalid time value:", timeStr);  // Log the error if parsing fails
    return 0;
  }

  return h * 60 + m;  // Convert to total minutes
}

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const standard = hour % 12 === 0 ? 12 : hour % 12;
  return `${standard} ${suffix}`;
}

function getTextColor(bgColor) {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}

function WeekView({
  categories,
  events,
  editingEvent,
  setEditingEvent,
  isEventModalOpen,
  setIsEventModalOpen,
  selectedDate,
  setSelectedDate,
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
  const [pendingEvent, setPendingEvent] = useState(null);
  const eventModalRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);


  useLayoutEffect(() => {
    const row = document.querySelector(".h-14");
    if (row) setRowHeight(row.offsetHeight);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(dayjs()), 60000); // update every minute
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const rects = redLineContainerRef.current?.querySelectorAll(".day-column") || [];
    const todayIndex = weekDates.findIndex((d) => dayjs(d).isSame(dayjs(), "day"));
    if (rects[todayIndex]) {
      const cell = rects[todayIndex].getBoundingClientRect();
      const parent = redLineContainerRef.current.getBoundingClientRect();
      const newRect = {
        left: cell.left - parent.left,
        width: cell.width,
      };

      setCalendarRect((prev) =>
        !prev || prev.left !== newRect.left || prev.width !== newRect.width
          ? newRect
          : prev
      );
    }
  }, [weekDates]);

  const totalMinutes = currentTime.hour() * 60 + currentTime.minute();
  const topPx = (totalMinutes / 60) * rowHeight;

  useEffect(() => {
    if (redLineContainerRef.current) {
      redLineContainerRef.current.scrollTop = topPx - 100;
    }
  }, [topPx]);
  useEffect(() => {
  function handleMouseUp() {
    if (isDragging && dragStart && dragEnd) {
      const startHour = Math.min(dragStart.hour, dragEnd.hour);
      const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;

      const pending = {
        title: "New Event",
        timeStart: `${startHour.toString().padStart(2, "0")}:00`,
        timeEnd: `${endHour.toString().padStart(2, "0")}:00`,
        date: dragStart.day.toISOString().split("T")[0],
        category: undefined,
        budget: 0,
      };

      setPendingEvent(pending);
      setSelectedDate(pending.date);
      setSelectedHour(startHour);
      setEditingEvent(null);

      setTimeout(() => {
        const previewEl = document.querySelector('[data-event-id="preview"]');
        if (!previewEl) return;

        const rect = previewEl.getBoundingClientRect();
        const modalWidth = 300;
        const modalHeight = 500;

        let top = rect.top + window.scrollY;
        let left = rect.right + window.scrollX + 8;

        if (left + modalWidth > window.innerWidth) {
          left = rect.left - modalWidth - 8 + window.scrollX;
        }

        const maxTop = document.documentElement.scrollHeight - modalHeight - 16;
        if (top > maxTop) {
          top = maxTop;
        }

        setModalPosition({ top, left });
        setIsEventModalOpen(true);
      }, 0);
    }

    // Cleanup
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }

  window.addEventListener("mouseup", handleMouseUp);
  return () => window.removeEventListener("mouseup", handleMouseUp);
}, [isDragging, dragStart, dragEnd, setSelectedDate, setSelectedHour, setEditingEvent, setModalPosition, setIsEventModalOpen]);

  function handleTimeCellClick(day, hour) {
    const dateStr = day.toISOString().split("T")[0];
    const pending = {
      title: "New Event",
      timeStart: `${hour.toString().padStart(2, "0")}:00`,
      timeEnd: `${(hour + 1).toString().padStart(2, "0")}:00`,
      date: dateStr,
      category: undefined,
      budget: 0,
    };

    setPendingEvent(pending);
    setSelectedHour(hour);
    setEditingEvent(null);
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);

    setTimeout(() => {
      const previewEl = document.querySelector('[data-event-id="preview"]');
      if (!previewEl) return;

      const rect = previewEl.getBoundingClientRect();
      const modalWidth = 300;
      const modalHeight = 500;

      let top = rect.top + window.scrollY;
      let left = rect.right + window.scrollX + 8;

      if (left + modalWidth > window.innerWidth) {
        left = rect.left - modalWidth - 8 + window.scrollX;
      }

      const maxTop = document.documentElement.scrollHeight - modalHeight - 16;
      if (top > maxTop) {
        top = maxTop;
      }

      setModalPosition({ top, left });
      setIsEventModalOpen(true);
    }, 0);
  }

  function handleEventClick(event) {
    setEditingEvent(event);
    setIsEventModalOpen(true);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] sticky top-0 z-10 bg-white">
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

      <div ref={redLineContainerRef} className="overflow-y-auto flex-1 relative">
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
                  onMouseDown={() => {
                    setIsDragging(true);
                    setDragStart({ day, hour });
                    setDragEnd({ hour });
                  }}
                  onClick={(e) => handleTimeCellClick(day, hour, e)}
                  // onMouseEnter={() => {
                  //   if (isDragging && dragStart?.day?.toDateString() === day.toDateString()) {
                  //     setDragEnd({ hour });
                  //   }
                  // }}
                  // onMouseLeave={() => {
                  //   if (isDragging) {
                  //     setDragEnd({ hour });
                  //   }
                  // }}
                  // onMouseMove={(e) => {
                  //   if (isDragging) {
                  //     const rect = e.currentTarget.getBoundingClientRect();
                  //     const offsetY = e.clientY - rect.top;
                  //     const newHour = Math.floor((offsetY / rowHeight) * 24);
                  //     setDragEnd({ day, hour: newHour });
                  //   }
                  // }}
            
                >
                  {events
                    .filter(
                      (event) =>
                        dayjs(event.date).isSame(day, "day") &&
                        getMinutes(event.timeStart) >= hour * 60 &&
                        getMinutes(event.timeStart) < (hour + 1) * 60 &&
                        (event.category === undefined ||
                          categories.find((c) => c.name === event.category)?.visible !== false)
                    )
                    .map((event) => {
                      const startMinutes = getMinutes(event.timeStart);
                      const endMinutes = getMinutes(event.timeEnd);
                      const top = ((startMinutes - hour * 60) / 60) * 100;
                      const height = ((endMinutes - startMinutes) / 60) * 100;
                      const bg = categories.find((c) => c.name === event.category)?.color || "#e0e0e0";
                      return (
                        <div
                          key={event.id}
                          data-event-id={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className="absolute px-2 py-1 rounded text-xs font-medium shadow-sm cursor-pointer z-10"
                          style={{
                            top: `${top}%`,
                            height: `${height}%`,
                            left: "4px",
                            width: "calc(100% - 20px)",
                            backgroundColor: bg,
                            color: getTextColor(bg),
                          }}
                        >
                          {event.title} {event.budget > 0 && `($${event.budget})`}
                        </div>
                      );
                    })}

                  {
                    pendingEvent &&
                    dayjs((pendingEvent ?? dragStart)?.date).isSame(day, "day") && (
                      (() => {
                        const startHour = getMinutes(pendingEvent.timeStart) / 60;
                        const endHour = getMinutes(pendingEvent.timeEnd) / 60;

                        if (startHour === undefined || endHour === undefined) return null;

                        const top = ((Math.min(startHour, endHour) - hour) / 1) * 100;
                        const height = Math.abs(endHour - startHour) * 100;

                        return top >= 0 && top < 100 ? (
                          <div
                            data-event-id="preview"
                            className="absolute left-[2px] right-[2px] px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-900 border border-blue-400 opacity-70 z-10"
                            style={{
                              top: `${top}%`,
                              height: `${height}%`,
                            }}
                          >
                            New Event
                          </div>
                        ) : null;
                      })()
                    )
                  }
                </div>
              ))}
            </Fragment>
          ))}
        </div>

        {calendarRect && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{ top: `${topPx}px`, left: `${calendarRect.left}px`, width: `${calendarRect.width}px` }}
          >
            <div className="h-[2px] bg-red-500 w-[calc(100%-4px)] mx-auto" />
          </div>
        )}
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        setIsOpen={setIsEventModalOpen}
        onSave={onSaveEvent}
        onDelete={onDeleteEvent}
        editingEvent={editingEvent}
        categories={categories}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        modalPosition={modalPosition}
        setModalPosition={setModalPosition}
        setPendingEvent={setPendingEvent}
        ref={eventModalRef}
      />
    </div>
  );
}

export default WeekView;
