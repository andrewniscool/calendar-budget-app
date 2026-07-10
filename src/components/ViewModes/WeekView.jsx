import { Fragment, useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import dayjs from "dayjs";
import EventModal from "../EventModal";
import EventBlock from "./EventBlock";
import { getBlockOffsets, layoutDayEvents } from "./timeGrid";

const GUTTER = "64px";

function getStartOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay(); // 0 (Sun) to 6 (Sat)
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const standard = hour % 12 === 0 ? 12 : hour % 12;
  return `${standard} ${suffix}`;
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
  const todayIndex = weekDates.findIndex((d) => dayjs(d).isSame(dayjs(), "day"));

  const redLineContainerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [calendarRect, setCalendarRect] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [rowHeight, setRowHeight] = useState(64);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);

  useLayoutEffect(() => {
    const row = document.querySelector(".day-column");
    if (row) setRowHeight(row.offsetHeight);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(dayjs()), 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const updateRedLinePosition = useCallback(() => {
    const rects = redLineContainerRef.current?.querySelectorAll(".day-column") ?? [];
    const todayIdx = weekDates.findIndex((d) => dayjs(d).isSame(dayjs(), "day"));
    if (rects[todayIdx]) {
      const cell = rects[todayIdx].getBoundingClientRect();
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
      if (isDragging && dragStart && dragEnd && dragStart.hour !== dragEnd.hour) {
        const startHour = Math.min(dragStart.hour, dragEnd.hour);
        const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;

        const pending = {
          title: "New Event",
          timeStart: `${startHour.toString().padStart(2, "0")}:00`,
          timeEnd: `${endHour.toString().padStart(2, "0")}:00`,
          date: dragStart.day.toISOString().split("T")[0],
          categoryId: "",
          budget: 0,
        };

        setPendingEvent(pending);

        setSelectedHour(startHour);
        setEditingEvent(null);
        suppressClickRef.current = true;

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

      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDragging, dragStart, dragEnd, setPendingEvent, setSelectedDate, setSelectedHour, setEditingEvent, setModalPosition, setIsEventModalOpen]);

  function handleTimeCellClick(day, hour) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const dateStr = day.toISOString().split("T")[0];
    const pending = {
      title: "New Event",
      timeStart: `${hour.toString().padStart(2, "0")}:00`,
      timeEnd: `${(hour + 1).toString().padStart(2, "0")}:00`,
      date: dateStr,
      categoryId: "",
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

      // Shift left if right edge overflows window
      if (left + modalWidth > window.innerWidth) {
        left = rect.left - modalWidth - 8 + window.scrollX;
      }

      // Clamp top so modal does not overflow viewport bottom
      const maxTop = window.scrollY + window.innerHeight - modalHeight - 200;
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
    setPendingEvent(false);
  }

  const dragRange =
    isDragging && dragStart && dragEnd
      ? {
          dayKey: dayjs(dragStart.day).format("YYYY-MM-DD"),
          min: Math.min(dragStart.hour, dragEnd.hour),
          max: Math.max(dragStart.hour, dragEnd.hour),
        }
      : null;

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className="sticky top-0 z-20 grid border-b border-slate-200 bg-white"
        style={{ gridTemplateColumns: `${GUTTER} repeat(7, minmax(0, 1fr))` }}
      >
        <div />
        {weekDates.map((date, index) => {
          const isTodayHeader = index === todayIndex;
          const isSelectedHeader =
            !isTodayHeader && dayjs(date).isSame(dayjs(selectedDate), "day");
          return (
            <div key={index} className="flex min-w-0 items-center justify-center gap-1.5 py-2">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isTodayHeader ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {date.toLocaleDateString("default", { weekday: "short" })}
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  isTodayHeader
                    ? "bg-slate-900 font-semibold text-white"
                    : isSelectedHeader
                    ? "bg-slate-200 font-medium text-slate-900"
                    : "font-medium text-slate-700"
                }`}
              >
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div
        ref={redLineContainerRef}
        className="relative flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
      >
        <div
          className="grid select-none"
          style={{ gridTemplateColumns: `${GUTTER} repeat(7, minmax(0, 1fr))` }}
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <Fragment key={hour}>
              <div className="relative h-16 bg-white">
                {hour !== 0 && (
                  <span className="absolute right-2.5 top-0 -translate-y-1/2 text-[11px] font-medium tabular-nums text-slate-400">
                    {formatHour(hour)}
                  </span>
                )}
              </div>
              {weekDates.map((day, dayIndex) => {
                const inDrag =
                  dragRange &&
                  dragRange.dayKey === dayjs(day).format("YYYY-MM-DD") &&
                  hour >= dragRange.min &&
                  hour <= dragRange.max;
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={`day-column relative h-16 cursor-pointer border-l border-slate-200/60 transition-colors ${
                      hour !== 0 ? "border-t" : ""
                    } ${
                      inDrag
                        ? "bg-slate-100"
                        : dayIndex === todayIndex
                        ? "bg-slate-50/60"
                        : ""
                    } hover:bg-slate-100/70`}
                    onMouseDown={() => {
                      setIsDragging(true);
                      setDragStart({ day, hour });
                      setDragEnd({ day, hour });
                    }}
                    onMouseEnter={() => {
                      if (isDragging && dragStart) {
                        setDragEnd({ day: dragStart.day, hour });
                      }
                    }}
                    onClick={(e) => handleTimeCellClick(day, hour, e)}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>

        <div
          className="pointer-events-none absolute right-0 top-0 grid grid-cols-7"
          style={{ left: GUTTER, height: `${24 * rowHeight}px` }}
        >
          {weekDates.map((day, dayIndex) => {
            const dayItems = layoutDayEvents(
              events.filter(
                (event) =>
                  dayjs(event.date).isSame(day, "day") &&
                  getCategoryForEvent(event)?.visible !== false
              )
            );

            return (
              <div key={`events-${dayIndex}`} className="relative min-w-0">
                {dayItems.map((item) => {
                  const color =
                    item.event.categoryColor ||
                    getCategoryForEvent(item.event)?.color ||
                    "#94a3b8";
                  return (
                    <EventBlock
                      key={item.event.id}
                      item={item}
                      color={color}
                      rowHeight={rowHeight}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(item.event);
                      }}
                    />
                  );
                })}

                {pendingEvent && dayjs(pendingEvent.date).isSame(day, "day") && (
                  <div
                    data-event-id="preview"
                    className="pointer-events-auto absolute left-[2px] right-[6px] z-20 rounded-md border border-dashed border-slate-400 bg-white/90 px-2 py-1 text-xs font-medium text-slate-500 shadow-sm"
                    style={getBlockOffsets(pendingEvent.timeStart, pendingEvent.timeEnd, rowHeight)}
                  >
                    New event
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {calendarRect && todayIndex !== -1 && (
          <div
            className="pointer-events-none absolute z-30"
            style={{ top: `${topPx}px`, left: `${calendarRect.left}px`, width: `${calendarRect.width}px` }}
          >
            <div className="relative">
              <div className="absolute -left-[3px] -top-[3px] h-2 w-2 rounded-full bg-rose-500" />
              <div className="h-[2px] w-full bg-rose-500" />
            </div>
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
