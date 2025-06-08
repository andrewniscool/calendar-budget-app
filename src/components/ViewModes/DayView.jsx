import { Fragment, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import EventModal from "../EventModal";

function getMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(":")) return 0;
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
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
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
  pendingEvent,
  setPendingEvent
}) {
  const today = selectedDate ? dayjs(selectedDate).toDate() : new Date();
  const redLineContainerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  const rowHeight = 56;

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
      category: undefined,
      budget: 0,
    };

    setPendingEvent(pending);
    setSelectedDate(dateStr);
    setSelectedHour(hour);
    setEditingEvent(null);

    setTimeout(() => {
      const previewEl = document.querySelector('[data-event-id="preview"]');
      if (!previewEl) return;

      const rect = previewEl.getBoundingClientRect();
      const modalWidth = 300;
      const modalHeight = 500;

      let top = e.clientY + window.scrollY;
      let left = e.clientX + window.scrollX + 8;
      console.log("Clicked at:", e.clientX, e.clientY);

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

  return (
    <div className="flex flex-col h-full">
      <div className="text-center py-2 font-medium text-lg bg-white sticky top-0 z-10">
        {dayjs(today).format("dddd, MMMM D")}
      </div>

      <div ref={redLineContainerRef} className="overflow-y-auto flex-1 relative">
        <div className="grid grid-cols-[80px_1fr]">
          {hours.map((hour) => (
            <Fragment key={hour}>
              <div className="border-t border-l pr-2 text-xs text-gray-500 bg-gray-50 h-14 flex items-start pt-1 justify-end">
                {formatHour(hour)}
              </div>
              <div
                key={`${hour}`}
                className="border-t border-l relative h-14 cursor-pointer"
                onClick={(e) => handleTimeClick(hour, e)}
              >
                {events
                  .filter(
                    (event) =>
                      dayjs(event.date).isSame(dayjs(today), "day") &&
                      getMinutes(event.timeStart) >= hour * 60 &&
                      getMinutes(event.timeStart) < (hour + 1) * 60 &&
                      (event.category === undefined ||
                        categories.find((c) => c.name === event.category)?.visible !== false)
                  )
                  .map((event) => {
                    const start = getMinutes(event.timeStart);
                    const end = getMinutes(event.timeEnd);
                    const top = ((start - hour * 60) / 60) * 100;
                    const height = ((end - start) / 60) * 100;
                    const bg = categories.find((c) => c.name === event.category)?.color || "#e0e0e0";

                    return (
                      <div
                        key={event.id}
                        data-event-id={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEvent(event);
                          setIsEventModalOpen(true);
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
              </div>
            </Fragment>
          ))}
        </div>

        {/* Red Line for current time */}
        {isToday && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{ top: `${topPx}px`, left: "80px", right: "0px" }}
          >
            <div className="h-[2px] bg-red-500 w-full" />
          </div>
        )}

        {/* Preview pending event */}
        {pendingEvent &&
          dayjs(pendingEvent.date).isSame(dayjs(today), "day") && (() => {
            const startMinutes = getMinutes(pendingEvent.timeStart);
            const endMinutes = getMinutes(pendingEvent.timeEnd);
            const top = (startMinutes / 60) * rowHeight;
            const height = ((endMinutes - startMinutes) / 60) * rowHeight;

            return (
              <div
                data-event-id="preview"
                className="absolute left-[82px] right-[2px] px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-900 border border-blue-400 opacity-70 z-10"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                }}
              >
                New Event
              </div>
            );
          })()}
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
      />
    </div>
  );
}

export default DayView;
