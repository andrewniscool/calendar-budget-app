// ✅ Calendar.jsx
import { Fragment } from "react";
import EventModal from "./EventModal";
import DayModal from "./DayModal";

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
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
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
  isDayModalOpen,
  setIsDayModalOpen,
  selectedDay,
  setSelectedDay,
  selectedHour,
  setSelectedHour,
  onSaveEvent,
  onDeleteEvent
}) {
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  function handleDayClick(dayIndex, hour = null) {
    setSelectedDay(dayIndex);
    setSelectedHour(hour);
    setEditingEvent(null);
    setIsDayModalOpen(true);
  }

  function handleAddClick(day) {
    setSelectedDay(day);
    setEditingEvent(null);
    setIsDayModalOpen(false);
    setIsEventModalOpen(true);
  }

  function handleEventClick(event) {
    setEditingEvent(event);
    setIsDayModalOpen(false);
    setIsEventModalOpen(true);
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] h-full overflow-y-auto border-t border-l relative">
        {/* Header */}
        <div className="border-b bg-gray-50"></div>
        {weekDates.map((date, index) => (
          <div
            key={index}
            className="border-b border-l p-2 text-center text-sm font-medium bg-gray-50"
          >
            {date.toLocaleDateString("default", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        ))}

        {/* Time + Grid */}
        {Array.from({ length: 24 }, (_, hour) => (
          <Fragment key={hour}>
            <div className="border-t border-l px-2 py-1 text-xs text-gray-500 bg-gray-50 h-14">
              {formatHour(hour)}
            </div>
            {weekDates.map((_, dayIndex) => (
              <div
                key={dayIndex + "-" + hour}
                className="border-t border-l relative h-14 cursor-pointer hover:bg-blue-50"
                onClick={() => handleDayClick(dayIndex, hour)}
              >
                {events
                  .filter(
                    (event) =>
                      event.day === dayIndex &&
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className="absolute left-[2px] right-[2px] px-2 py-1 rounded text-xs font-medium shadow-sm cursor-pointer"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          backgroundColor: bg,
                          color: getTextColor(bg),
                        }}
                      >
                        {event.title} {event.budget > 0 && `($${event.budget})`}
                      </div>
                    );
                  })}
              </div>
            ))}
          </Fragment>
        ))}
      </div>

      <DayModal
        isOpen={isDayModalOpen}
        setIsOpen={setIsDayModalOpen}
        day={selectedDay}
        events={events.filter((e) => e.day === selectedDay)}
        onAddClick={handleAddClick}
        onEditClick={handleEventClick}
        onDelete={onDeleteEvent}
      />

      <EventModal
        isOpen={isEventModalOpen}
        setIsOpen={setIsEventModalOpen}
        onSave={onSaveEvent}
        onDelete={onDeleteEvent}
        editingEvent={editingEvent}
        categories={categories}
        selectedHour={selectedHour}
      />
    </div>
  );
}

export default Calendar;
