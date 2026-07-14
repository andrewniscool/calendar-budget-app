import { Fragment, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import EventModal from "../EventModal";
import EventBlock from "./EventBlock";
import { getBlockOffsets, layoutDayEvents } from "./timeGrid";

const GUTTER = "64px";

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const standard = hour % 12 === 0 ? 12 : hour % 12;
  return `${standard} ${suffix}`;
}

function DayView({
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
  modalAnchorRect,
  setModalAnchorRect,
  pendingEvent,
  setPendingEvent
}) {
  const getCategoryForEvent = (event) =>
    categories.find((item) => item.category_id === event.categoryId);

  const today = selectedDate ? dayjs(selectedDate).toDate() : new Date();
  const redLineContainerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  const rowHeight = 64;

  const isToday = dayjs().isSame(dayjs(selectedDate), "day");
  const totalMinutes = currentTime.hour() * 60 + currentTime.minute();
  const topPx = (totalMinutes / 60) * rowHeight;

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(dayjs()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (redLineContainerRef.current && isToday) {
      redLineContainerRef.current.scrollTop = topPx - 100;
    }
  }, [topPx, isToday]);

  function handleTimeClick(hour, e) {
    const dateStr = dayjs(today).format("YYYY-MM-DD");

    const pending = {
      title: "New Event",
      timeStart: `${hour.toString().padStart(2, "0")}:00`,
      timeEnd: `${(hour + 1).toString().padStart(2, "0")}:00`,
      date: dateStr,
      categoryId: "",
      budget: 0,
    };

    setPendingEvent(pending);
    setSelectedDate(dateStr);
    setSelectedHour(hour);
    setEditingEvent(null);
    const cellRect = e.currentTarget.getBoundingClientRect();

    setTimeout(() => {
      const previewEl = document.querySelector('[data-event-id="preview"]');
      if (!previewEl) return;

      setModalAnchorRect(previewEl.getBoundingClientRect() || cellRect);
      setIsEventModalOpen(true);
    }, 0);
  }

  const dayItems = layoutDayEvents(
    events.filter(
      (event) =>
        dayjs(event.date).isSame(dayjs(today), "day") &&
        getCategoryForEvent(event)?.visible !== false
    )
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className="sticky top-0 z-20 grid overflow-y-scroll border-b border-slate-200 bg-white scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
        style={{ gridTemplateColumns: `${GUTTER} 1fr`, scrollbarGutter: "stable" }}
      >
        <div />
        <div className={`flex items-center gap-3 border-l border-slate-200/60 px-4 py-2 ${isToday ? "bg-slate-50/60" : ""}`}>
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full text-base ${
              isToday
                ? "bg-slate-900 font-semibold text-white"
                : "bg-slate-100 font-medium text-slate-700"
            }`}
          >
            {dayjs(today).date()}
          </span>
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {dayjs(today).format("dddd")}
            </span>
            <span className="text-sm font-medium leading-tight text-slate-900">
              {dayjs(today).format("MMMM D, YYYY")}
            </span>
          </div>
        </div>
      </div>

      <div
        ref={redLineContainerRef}
        className="relative flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
        style={{ scrollbarGutter: "stable" }}
      >
        <div
          className="grid select-none"
          style={{ gridTemplateColumns: `${GUTTER} 1fr` }}
        >
          {hours.map((hour) => (
            <Fragment key={hour}>
              <div className="relative h-16 bg-white">
                {hour !== 0 && (
                  <span className="absolute right-2.5 top-0 -translate-y-1/2 text-[11px] font-medium tabular-nums text-slate-400">
                    {formatHour(hour)}
                  </span>
                )}
              </div>
              <div
                className={`relative h-16 cursor-pointer border-l border-slate-200/60 transition-colors hover:bg-slate-100/70 ${
                  hour !== 0 ? "border-t" : ""
                } ${isToday ? "bg-slate-50/60" : ""}`}
                onClick={(e) => handleTimeClick(hour, e)}
              />
            </Fragment>
          ))}
        </div>

        <div
          className="pointer-events-none absolute right-0 top-0"
          style={{ left: GUTTER, height: `${24 * rowHeight}px` }}
        >
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
                  setEditingEvent(item.event);
                  setModalAnchorRect(e.currentTarget.getBoundingClientRect());
                  setIsEventModalOpen(true);
                }}
              />
            );
          })}

          {/* Preview pending event */}
          {pendingEvent && dayjs(pendingEvent.date).isSame(dayjs(today), "day") && (
            <div
              data-event-id="preview"
              className="pointer-events-auto absolute left-[2px] right-[6px] z-20 rounded-md border border-dashed border-slate-400 bg-white/90 px-2 py-1 text-xs font-medium text-slate-500 shadow-sm"
              style={getBlockOffsets(pendingEvent.timeStart, pendingEvent.timeEnd, rowHeight)}
            >
              New event
            </div>
          )}
        </div>

        {/* Current time indicator */}
        {isToday && (
          <div
            className="pointer-events-none absolute right-0 z-30"
            style={{ top: `${topPx}px`, left: GUTTER }}
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
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        anchorRect={modalAnchorRect}
        modalPosition={modalPosition}
        setModalPosition={setModalPosition}
        setPendingEvent={setPendingEvent}
      />
    </div>
  );
}

export default DayView;
