import React, { useState } from "react";
import dayjs from "dayjs";
import EventModal from "../EventModal";

const MAX_VISIBLE_EVENTS = 3;

function MonthView({
  setViewMode,
  setSelectedDate,
  onSaveEvent,
  onDeleteEvent,
  categories,
  selectedDate,
  events
}) {
  const currentMonth = dayjs(selectedDate);
  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const startDay = startOfMonth.day();

  const prevMonth = currentMonth.subtract(1, "month");
  const nextMonth = currentMonth.add(1, "month");

  const [pendingEvent, setPendingEvent] = useState(null);
  const [modalPosition, setModalPosition] = useState(null);
  const [modalAnchorRect, setModalAnchorRect] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const getCategoryForEvent = (event) =>
    categories.find((item) => item.category_id === event.categoryId);

  const days = [];

  const prevMonthDays = prevMonth.daysInMonth();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: dayjs(prevMonth).date(prevMonthDays - i),
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: dayjs(currentMonth).date(i),
      isCurrentMonth: true,
    });
  }

  // Pad to at least 5 full weeks, always ending on a complete week row.
  let i = 1;
  while (days.length < 35 || days.length % 7 !== 0) {
    days.push({
      date: dayjs(nextMonth).date(i++),
      isCurrentMonth: false,
    });
  }
  const weeks = days.length / 7;

  const handleDayCellClick = (e, entry) => {
    e.stopPropagation();
    setEditingEvent(null);

    const dateStr = entry.date.format("YYYY-MM-DD");
    setPendingEvent({
      title: "",
      date: dateStr,
      timeStart: "00:00",
      timeEnd: "01:00",
      categoryId: "",
      budget: 0,
    });

    setModalAnchorRect(e.currentTarget.getBoundingClientRect());
    setIsEventModalOpen(true);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="border-l border-slate-200/60 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 first:border-l-0"
          >
            {day}
          </div>
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 grid-cols-7"
        style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {days.map((entry, index) => {
          const isToday = entry.date.isSame(dayjs(), "day");
          const isSelected =
            !isToday && entry.date.isSame(dayjs(selectedDate), "day");
          const isPending = pendingEvent?.date === entry.date.format("YYYY-MM-DD");

          const dayEvents = events.filter(
            (event) =>
              dayjs(event.date).isSame(entry.date, "day") &&
              getCategoryForEvent(event)?.visible !== false
          );
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const hiddenCount = dayEvents.length - visibleEvents.length;

          return (
            <div
              key={index}
              onClick={(e) => handleDayCellClick(e, entry)}
              className={`relative flex min-w-0 cursor-pointer flex-col gap-0.5 overflow-hidden border-b border-r border-slate-200/60 px-1.5 py-1 transition-colors hover:bg-slate-50 ${
                entry.isCurrentMonth ? "bg-white" : "bg-slate-50/60"
              } ${isPending ? "bg-slate-50 ring-2 ring-inset ring-slate-300" : ""}`}
            >
              <div className="flex">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(entry.date);
                    setViewMode("day");
                  }}
                  className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs transition-colors duration-150 ${
                    isToday
                      ? "bg-slate-900 font-semibold text-white hover:bg-slate-700"
                      : isSelected
                      ? "bg-slate-200 font-medium text-slate-900 hover:bg-slate-300"
                      : entry.isCurrentMonth
                      ? "font-medium text-slate-700 hover:bg-slate-100"
                      : "font-medium text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {entry.date.date() === 1
                    ? entry.date.format("MMM D")
                    : entry.date.date()}
                </button>
              </div>

              <div className="min-w-0 space-y-0.5 overflow-hidden">
                {visibleEvents.map((event) => {
                  const color =
                    event.categoryColor ||
                    getCategoryForEvent(event)?.color ||
                    "#94a3b8";
                  return (
                    <div
                      key={event.id}
                      className={`flex min-w-0 cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-[11px] font-medium hover:bg-slate-100 ${
                        entry.isCurrentMonth ? "text-slate-700" : "text-slate-400"
                      }`}
                      title={event.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEvent(event);
                        setModalAnchorRect(e.currentTarget.getBoundingClientRect());
                        setIsEventModalOpen(true);
                      }}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-[3px]"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate">{event.title}</span>
                      {event.budget > 0 && (
                        <span className="ml-auto shrink-0 text-[10px] tabular-nums text-slate-400">
                          ${event.budget}
                        </span>
                      )}
                    </div>
                  );
                })}
                {hiddenCount > 0 && (
                  <div className="px-1 text-[11px] font-medium text-slate-400">
                    +{hiddenCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        setIsOpen={setIsEventModalOpen}
        onSave={async (eventData) => {
          await onSaveEvent(eventData);
          setIsEventModalOpen(false);
          setPendingEvent(null);
        }}
        onDelete={onDeleteEvent}
        editingEvent={editingEvent}
        categories={categories}
        selectedDate={pendingEvent?.date}
        selectedHour={0}
        anchorRect={modalAnchorRect}
        modalPosition={modalPosition}
        setModalPosition={setModalPosition}
        setPendingEvent={setPendingEvent}
      />
    </div>
  );
}

export default MonthView;
