import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";
import { fetchCategories } from "./services/categoryService";
import { deleteEvent, fetchEvents, saveEvent } from "./services/eventService";

function mapEventFromApi(event, calendar) {
  return {
    ...event,
    timeStart: event.timeStart ?? event.time_start,
    timeEnd: event.timeEnd ?? event.time_end,
    categoryId: event.categoryId ?? event.category_id ?? "",
    categoryName: event.categoryName ?? event.category_name ?? event.category ?? "Uncategorized",
    categoryColor: event.categoryColor ?? event.category_color ?? "",
    calendarId: event.calendarId ?? event.calendar_id ?? calendar.calendar_id,
    calendarName: calendar.name,
    calendarColor: calendar.color,
  };
}

function MainApp({ calendars, onCreateCalendar, onDeleteCalendar, onLogout }) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [visibleCalendarIds, setVisibleCalendarIds] = useState(
    () => new Set(calendars.map((calendar) => calendar.calendar_id))
  );
  const [focusedCalendarId, setFocusedCalendarId] = useState(
    calendars[0]?.calendar_id ?? null
  );
  const knownCalendarIds = useRef(
    new Set(calendars.map((calendar) => calendar.calendar_id))
  );
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedHour, setSelectedHour] = useState(null);
  const [modalPosition, setModalPosition] = useState(null);
  const [modalAnchorRect, setModalAnchorRect] = useState(null);
  const [viewMode, setViewMode] = useState("week");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [budgetLimits, setBudgetLimits] = useState({
    overall: 1000,
    Work: 300,
    Food: 200,
    Study: 150,
    Uncategorized: 100,
  });

  useEffect(() => {
    const currentIds = new Set(calendars.map((calendar) => calendar.calendar_id));
    setVisibleCalendarIds((previous) => {
      const next = new Set([...previous].filter((id) => currentIds.has(id)));
      calendars.forEach((calendar) => {
        if (!knownCalendarIds.current.has(calendar.calendar_id)) {
          next.add(calendar.calendar_id);
        }
      });
      return next;
    });
    knownCalendarIds.current = currentIds;
    setFocusedCalendarId((current) =>
      currentIds.has(current) ? current : calendars[0]?.calendar_id ?? null
    );
  }, [calendars]);

  const loadWorkspaceData = useCallback(async () => {
    if (calendars.length === 0) {
      setEvents([]);
      setCategories([]);
      setWorkspaceError("");
      return;
    }

    setWorkspaceLoading(true);
    setWorkspaceError("");
    const results = await Promise.allSettled(
      calendars.map(async (calendar) => {
        const [calendarEvents, calendarCategories] = await Promise.all([
          fetchEvents(calendar.calendar_id),
          fetchCategories(calendar.calendar_id),
        ]);
        return {
          events: calendarEvents.map((event) => mapEventFromApi(event, calendar)),
          categories: calendarCategories.map((category) => ({
            ...category,
            calendarId: calendar.calendar_id,
            visible: true,
          })),
        };
      })
    );

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    setEvents(fulfilled.flatMap((result) => result.value.events));
    setCategories(fulfilled.flatMap((result) => result.value.categories));
    const failedCount = results.length - fulfilled.length;
    if (failedCount > 0) {
      setWorkspaceError(
        failedCount === results.length
          ? "Events and categories could not be loaded."
          : `${failedCount} calendar${failedCount === 1 ? "" : "s"} could not be loaded.`
      );
    }
    setWorkspaceLoading(false);
  }, [calendars]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  const visibleEvents = useMemo(
    () => events.filter((event) => visibleCalendarIds.has(event.calendarId)),
    [events, visibleCalendarIds]
  );
  const focusedCategories = useMemo(
    () => categories.filter((category) => category.calendarId === focusedCalendarId),
    [categories, focusedCalendarId]
  );
  const modalCategories = useMemo(() => {
    const calendarId = editingEvent?.calendarId ?? focusedCalendarId;
    return categories.filter((category) => category.calendarId === calendarId);
  }, [categories, editingEvent, focusedCalendarId]);

  function updateFocusedCategories(update) {
    setCategories((current) => {
      const focused = current.filter(
        (category) => category.calendarId === focusedCalendarId
      );
      const nextFocused = typeof update === "function" ? update(focused) : update;
      return [
        ...current.filter((category) => category.calendarId !== focusedCalendarId),
        ...nextFocused.map((category) => ({
          ...category,
          calendarId: focusedCalendarId,
        })),
      ];
    });
  }

  async function handleSaveEvent({ title, budget, timeStart, timeEnd, categoryId, date }) {
    if (!date) {
      alert("Error: No day selected");
      return;
    }
    const calendarId = editingEvent?.calendarId ?? focusedCalendarId;
    if (!calendarId) {
      setWorkspaceError("Create a calendar before adding an event.");
      return;
    }
    const fallbackTitle = title.trim() === "" ? "New Event" : title;
    const parsedBudget = parseFloat(budget);
    const roundedBudget = isNaN(parsedBudget) ? 0 : parseFloat(parsedBudget.toFixed(2));
    const eventData = {
      title: fallbackTitle,
      budget: roundedBudget,
      timeStart: timeStart ?? `${selectedHour?.toString().padStart(2, "0")}:00`,
      timeEnd:
        timeEnd ?? `${(selectedHour !== null ? selectedHour + 1 : 1).toString().padStart(2, "0")}:00`,
      categoryId: categoryId || null,
      date,
      calendarId,
    };

    try {
      const calendar = calendars.find((item) => item.calendar_id === calendarId);
      if (editingEvent) {
        eventData.id = editingEvent.id;
        const updatedEvent = mapEventFromApi(await saveEvent(eventData), calendar);
        setEvents((current) =>
          current.map((event) =>
            event.id === editingEvent.id ? { ...event, ...updatedEvent } : event
          )
        );
      } else {
        const newEvent = mapEventFromApi(await saveEvent(eventData), calendar);
        setEvents((current) => [...current, newEvent]);
      }
      setEditingEvent(null);
      setIsEventModalOpen(false);
      setWorkspaceError("");
    } catch (error) {
      setWorkspaceError(error.message || "Failed to save event.");
    }
  }

  async function handleDeleteEvent(eventToDelete) {
    try {
      await deleteEvent(eventToDelete.id);
      setEvents((current) => current.filter((event) => event.id !== eventToDelete.id));
      setWorkspaceError("");
    } catch (error) {
      setWorkspaceError(error.message || "Failed to delete event.");
    }
  }

  function handleAddEventClick(event) {
    if (!focusedCalendarId) {
      setWorkspaceError("Create a calendar before adding an event.");
      return;
    }
    const now = new Date();
    setSelectedDate(now.toISOString().split("T")[0]);
    setSelectedHour(now.getHours());
    setEditingEvent(null);
    setModalAnchorRect(event?.currentTarget?.getBoundingClientRect() ?? null);
    setIsEventModalOpen(true);
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onLogout={onLogout}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className={`transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-0"} overflow-hidden`}>
          <Sidebar
            calendars={calendars}
            visibleCalendarIds={visibleCalendarIds}
            setVisibleCalendarIds={setVisibleCalendarIds}
            focusedCalendarId={focusedCalendarId}
            setFocusedCalendarId={setFocusedCalendarId}
            onCreateCalendar={onCreateCalendar}
            onDeleteCalendar={onDeleteCalendar}
            categories={focusedCategories}
            setCategories={updateFocusedCategories}
            onAddEventClick={handleAddEventClick}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            events={visibleEvents}
            budgetLimits={budgetLimits}
            setBudgetLimits={setBudgetLimits}
          />
        </div>
        <main className="relative flex-1 h-full overflow-hidden">
          {workspaceError && (
            <div role="alert" className="absolute right-3 top-3 z-30 flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-sm">
              <span>{workspaceError}</span>
              <button type="button" onClick={loadWorkspaceData} className="font-semibold underline">
                Retry
              </button>
            </div>
          )}
          {workspaceLoading && (
            <div className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-slate-100">
              <div className="h-full w-1/2 animate-pulse bg-slate-500" />
            </div>
          )}
          <Calendar
            viewMode={viewMode}
            setViewMode={setViewMode}
            categories={modalCategories}
            events={visibleEvents}
            editingEvent={editingEvent}
            setEditingEvent={setEditingEvent}
            isEventModalOpen={isEventModalOpen}
            setIsEventModalOpen={setIsEventModalOpen}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedHour={selectedHour}
            setSelectedHour={setSelectedHour}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
            modalPosition={modalPosition}
            setModalPosition={setModalPosition}
            modalAnchorRect={modalAnchorRect}
            setModalAnchorRect={setModalAnchorRect}
          />
        </main>
      </div>
    </div>
  );
}

export default MainApp;
