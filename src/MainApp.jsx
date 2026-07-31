import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";
import { fetchCategories } from "./services/categoryService";
import { deleteEvent, fetchEvents, saveEvent } from "./services/eventService";
import { fetchBudgetLimits, saveBudgetLimits } from "./services/budgetLimitService";
import { fetchFinancialSettings } from "./services/financialSettingsService";

const ENABLE_CALENDAR_GUIDANCE =
  "Enable a calendar in the sidebar before adding an event.";

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
    period: dayjs().format("YYYY-MM"),
    overall: null,
    categories: [],
  });
  const [currency, setCurrency] = useState("USD");

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
    setWorkspaceLoading(true);
    setWorkspaceError("");
    const [categoryResult, settingsResult, ...eventResults] = await Promise.allSettled([
      fetchCategories(),
      fetchFinancialSettings(),
      ...calendars.map((calendar) => fetchEvents(calendar.calendar_id)),
    ]);

    if (categoryResult.status === "fulfilled") {
      setCategories(categoryResult.value);
    } else {
      setCategories([]);
    }
    if (settingsResult.status === "fulfilled") {
      setCurrency(settingsResult.value.currency);
    }
    const loadedEvents = eventResults.flatMap((result, index) =>
      result.status === "fulfilled"
        ? result.value.map((event) => mapEventFromApi(event, calendars[index]))
        : []
    );
    setEvents(loadedEvents);
    const failedCount = eventResults.filter((result) => result.status === "rejected").length
      + (categoryResult.status === "rejected" ? 1 : 0)
      + (settingsResult.status === "rejected" ? 1 : 0);
    if (failedCount > 0) {
      setWorkspaceError(
        failedCount === eventResults.length + 2
          ? "Workspace data could not be loaded."
          : "Some workspace data could not be loaded."
      );
    }
    setWorkspaceLoading(false);
  }, [calendars]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  useEffect(() => {
    const period = dayjs(selectedDate).format("YYYY-MM");
    let active = true;
    fetchBudgetLimits(period)
      .then((limits) => {
        if (active) setBudgetLimits(limits);
      })
      .catch((error) => {
        if (active) setWorkspaceError(error.message || "Failed to load budget limits.");
      });
    return () => {
      active = false;
    };
  }, [selectedDate]);

  const visibleEvents = useMemo(
    () => events.filter((event) => visibleCalendarIds.has(event.calendarId)),
    [events, visibleCalendarIds]
  );
  const enabledCalendars = useMemo(
    () => calendars.filter((calendar) => visibleCalendarIds.has(calendar.calendar_id)),
    [calendars, visibleCalendarIds]
  );
  const defaultEventCalendarId = useMemo(() => {
    if (focusedCalendarId && visibleCalendarIds.has(focusedCalendarId)) {
      return focusedCalendarId;
    }
    return enabledCalendars[0]?.calendar_id ?? null;
  }, [enabledCalendars, focusedCalendarId, visibleCalendarIds]);

  useEffect(() => {
    if (defaultEventCalendarId) {
      setWorkspaceError((current) =>
        current === ENABLE_CALENDAR_GUIDANCE ? "" : current
      );
    }
  }, [defaultEventCalendarId]);

  function updateSharedCategories(update) {
    setCategories((current) => {
      const next = typeof update === "function" ? update(current) : update;
      const byId = new Map(next.map((category) => [String(category.category_id), category]));
      setEvents((currentEvents) => currentEvents.map((event) => {
        if (!event.categoryId) return event;
        const category = byId.get(String(event.categoryId));
        return category
          ? { ...event, categoryName: category.name, categoryColor: category.color }
          : { ...event, categoryId: "", categoryName: "Uncategorized", categoryColor: "" };
      }));
      return next;
    });
  }

  async function handleSaveBudgetLimits(nextLimits) {
    const saved = await saveBudgetLimits(nextLimits);
    setBudgetLimits(saved);
    return saved;
  }

  async function handleSaveEvent({
    title,
    budget,
    timeStart,
    timeEnd,
    categoryId,
    calendarId: submittedCalendarId,
    date,
  }) {
    if (!date) {
      alert("Error: No day selected");
      return;
    }
    const calendarId = editingEvent?.calendarId ?? submittedCalendarId;
    if (!calendarId) {
      setWorkspaceError(ENABLE_CALENDAR_GUIDANCE);
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
    if (!defaultEventCalendarId) {
      setWorkspaceError(ENABLE_CALENDAR_GUIDANCE);
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
            categories={categories}
            setCategories={updateSharedCategories}
            onAddEventClick={handleAddEventClick}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            events={events}
            budgetLimits={budgetLimits}
            onSaveBudgetLimits={handleSaveBudgetLimits}
            currency={currency}
          />
        </div>
        <main className="relative flex-1 h-full overflow-hidden">
          {workspaceError && (
            <div role="alert" className="absolute right-3 top-3 z-30 flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-sm">
              <span>{workspaceError}</span>
              {workspaceError !== ENABLE_CALENDAR_GUIDANCE && (
                <button type="button" onClick={loadWorkspaceData} className="font-semibold underline">
                  Retry
                </button>
              )}
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
            calendars={enabledCalendars}
            categories={categories}
            currency={currency}
            defaultEventCalendarId={defaultEventCalendarId}
            canCreateEvent={Boolean(defaultEventCalendarId)}
            onCreateBlocked={() => setWorkspaceError(ENABLE_CALENDAR_GUIDANCE)}
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
