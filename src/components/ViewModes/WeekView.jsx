import { Fragment, useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import dayjs from "dayjs";
import EventModal from "../EventModal";
import {
  buildPendingEvent,
  formatHour,
  getMinutes,
  getStartOfWeek,
  getTextColor,
  positionModalNextToElement,
} from "./calendarViewUtils";

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
  setModalPosition,
  pendingEvent,
  setPendingEvent,
  calendarId
}) {
  const getCategoryForEvent = (event) =>
    categories.find((item) => item.category_id === event.categoryId);

  const startOfWeek = getStartOfWeek(new Date(selectedDate));
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const redLineContainerRef = useRef(null);
  const [calendarRect, setCalendarRect] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [rowHeight, setRowHeight] = useState(56);
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


  const updateRedLinePosition = useCallback(() => {
    const rects = redLineContainerRef.current?.querySelectorAll(".day-column") ?? [];
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

useEffect(() => {
  updateRedLinePosition(); // initial call
  window.addEventListener("resize", updateRedLinePosition);
  return () => window.removeEventListener("resize", updateRedLinePosition);
}, [updateRedLinePosition]);

useEffect(() => {
  if (!redLineContainerRef.current) return;

  const observer = new ResizeObserver(() => {
    updateRedLinePosition();
  });

  observer.observe(redLineContainerRef.current);

  return () => observer.disconnect();
}, [updateRedLinePosition]);



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
      const pending = buildPendingEvent({
        date: dragStart.day.toISOString().split("T")[0],
        startHour,
        endHour,
      });

      setPendingEvent(pending);
      
      setSelectedHour(startHour);
      setEditingEvent(null);

      setTimeout(() => {
        const previewEl = document.querySelector('[data-event-id="preview"]');
        if (!previewEl) return;

        setModalPosition(positionModalNextToElement(previewEl, {
          bottomOffset: 16,
          clampToDocument: true,
        }));
        setIsEventModalOpen(true);
      }, 0);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }

  window.addEventListener("mouseup", handleMouseUp);
  return () => window.removeEventListener("mouseup", handleMouseUp);
}, [isDragging, dragStart, dragEnd, setPendingEvent, setSelectedDate, setSelectedHour, setEditingEvent, setModalPosition, setIsEventModalOpen]);

  function handleTimeCellClick(day, hour) {
    const dateStr = day.toISOString().split("T")[0];
    const pending = buildPendingEvent({ date: dateStr, startHour: hour });

    setPendingEvent(pending);
    setSelectedHour(hour);
    setEditingEvent(null);
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);

setTimeout(() => {
  const previewEl = document.querySelector('[data-event-id="preview"]');
  if (!previewEl) return;

  setModalPosition(positionModalNextToElement(previewEl, { bottomOffset: 200 }));
  setIsEventModalOpen(true);
}, 0);
  }

  function handleEventClick(event) {
    setEditingEvent(event);
    setIsEventModalOpen(true);
    setPendingEvent(false);
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
                    setDragEnd({ day, hour });
                  }}
                  onClick={(e) => handleTimeCellClick(day, hour, e)}
            
                >
                  {events
                    .filter(
                      (event) =>
                        dayjs(event.date).isSame(day, "day") &&
                        getMinutes(event.timeStart) >= hour * 60 &&
                        getMinutes(event.timeStart) < (hour + 1) * 60 &&
                        getCategoryForEvent(event)?.visible !== false
                    )
                    .map((event) => {
                      const startMinutes = getMinutes(event.timeStart);
                      const endMinutes = getMinutes(event.timeEnd);
                      const top = ((startMinutes - hour * 60) / 60) * 100;
                      const height = ((endMinutes - startMinutes) / 60) * 100;
                      const bg = event.categoryColor || getCategoryForEvent(event)?.color || "#e0e0e0";
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

        {calendarRect && weekDates.some(d => dayjs(d).isSame(dayjs(), "day")) && (
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
        selectedDate={pendingEvent?.date || selectedDate}
        selectedHour={selectedHour}
        modalPosition={modalPosition}
        setModalPosition={setModalPosition}
        setPendingEvent={setPendingEvent}
        calendarId={calendarId}
      />
    </div>
  );
}

export default WeekView;
