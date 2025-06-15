import React, { useState } from "react";
import dayjs from "dayjs";
import EventModal from "../EventModal";

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
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

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

  let i = 1;
  while (days.length < 35) {
    days.push({
      date: dayjs(nextMonth).date(i++),
      isCurrentMonth: false,
    });
  }

  const handleDayCellClick = (e, entry) => {
    e.stopPropagation();
    setEditingEvent(null);

    const dateStr = entry.date.format("YYYY-MM-DD");
    setPendingEvent({
      title: "",
      date: dateStr,
      timeStart: "00:00",
      timeEnd: "01:00",
      category: "",
      budget: 0,
    });

    const rect = e.currentTarget.getBoundingClientRect();
    const modalWidth = 300;
    const modalHeight = 500;
    const padding = 8;

    let left = rect.left + rect.width + padding;
    let top = rect.top + rect.height / 2 - modalHeight / 2;

    if (left + modalWidth > window.innerWidth) {
      left = rect.left - modalWidth - padding;
    }
    if (top + modalHeight > window.innerHeight) {
      top = window.innerHeight - modalHeight - padding;
    }

    const headerOffset = document.querySelector("header")?.offsetHeight || 0;
    top = Math.max(padding + headerOffset, top);

    setModalPosition({
      top: top + window.scrollY,
      left: left + window.scrollX,
    });

    setIsEventModalOpen(true);
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-1 text-center text-gray-500 mb-1 text-sm">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-5 w-full h-[calc(100vh-140px)]">
        {days.map((entry, index) => {
          const isToday = entry.date.isSame(dayjs(), "day");
          const isSelected = entry.date.isSame(dayjs(selectedDate), "day");
          const isPending = pendingEvent?.date === entry.date.format("YYYY-MM-DD");

          const dayEvents = events
            .filter(
              (event) =>
                dayjs(event.date).isSame(entry.date, "day") &&
                (event.category === undefined ||
                  categories.find((c) => c.name === event.category)?.visible !== false)
            )
            .slice(0, 3);

          return (
            <div
              key={index}
              onClick={(e) => handleDayCellClick(e, entry)}
              className={`border border-gray-200 relative text-xs p-1 cursor-pointer flex flex-col justify-start items-stretch overflow-hidden ${
                entry.isCurrentMonth ? "text-gray-800" : "text-gray-400"
              }`}
            >
              <div className="flex flex-col items-center justify-center relative w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDate(entry.date);
                    setViewMode("day");
                  }}
                  className={`leading-tight rounded-full px-2 py-1 text-xs transition-all duration-200 ${
                    isToday
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : isSelected
                      ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                      : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {entry.date.date() === 1 ? (
                    <div className="flex flex-col items-center text-[10px] uppercase leading-3">
                      <div>{entry.date.format("MMM")}</div>
                      <div className="text-xs">{entry.date.date()}</div>
                    </div>
                  ) : (
                    entry.date.date()
                  )}
                </button>

                <div className="mt-1 w-full space-y-0.5 overflow-hidden">
                  {dayEvents.map((event) => {
                    const bg = categories.find((c) => c.name === event.category)?.color || "#e0e0e0";
                    return (
                      <div
                        key={event.id}
                        className="truncate text-[10px] px-1 py-0.5 rounded text-white cursor-pointer"
                        style={{ backgroundColor: bg }}
                        title={event.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEvent(event);
                          setIsEventModalOpen(true);
                        }}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                </div>
              </div>

              {isPending && (
                <div className="absolute bottom-1 left-2 right-2 h-1 bg-blue-500 rounded-sm"></div>
              )}
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
        modalPosition={modalPosition}
        setModalPosition={setModalPosition}
        setPendingEvent={setPendingEvent}
      />
    </div>
  );
}

export default MonthView;
