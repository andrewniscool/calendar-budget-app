import { useState } from "react";
import BudgetDashboard from "../components/Budget_stuff/BudgetDashboard";
import CategoryManager from "./Sidebar_stuff/CategoryManager";
import MiniCalendar from "./Sidebar_stuff/MiniCalendar";
import { DEFAULT_CALENDAR_COLOR } from "../services/calendarService";

function CalendarsSection({
  calendars,
  visibleCalendarIds,
  setVisibleCalendarIds,
  focusedCalendarId,
  setFocusedCalendarId,
  onCreateCalendar,
  onDeleteCalendar,
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_CALENDAR_COLOR);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleCalendar(calendarId) {
    setVisibleCalendarIds((current) => {
      const next = new Set(current);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
        setFocusedCalendarId(calendarId);
      }
      return next;
    });
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a calendar name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await onCreateCalendar(name, color);
      setName("");
      setColor(DEFAULT_CALENDAR_COLOR);
      setIsCreating(false);
      setFocusedCalendarId(created.calendar_id);
    } catch (createError) {
      setError(createError.message || "Failed to create calendar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(calendar) {
    if (!window.confirm(`Delete “${calendar.name}” and all of its events? This cannot be undone.`)) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onDeleteCalendar(calendar.calendar_id);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete calendar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Calendars
        </span>
        <button
          type="button"
          onClick={() => {
            setIsCreating((current) => !current);
            setError("");
          }}
          aria-label="Add calendar"
          title="Add calendar"
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="mt-1.5 space-y-0.5">
        {calendars.length === 0 && (
          <p className="px-1 py-1.5 text-xs text-slate-400">
            No calendars yet. Create one to add events.
          </p>
        )}
        {calendars.map((calendar) => {
          const focused = calendar.calendar_id === focusedCalendarId;
          return (
            <div
              key={calendar.calendar_id}
              className={`group -mx-1 flex items-center gap-2 rounded-md px-1.5 py-1 ${
                focused ? "bg-slate-200/70" : "hover:bg-slate-200/50"
              }`}
            >
              <input
                type="checkbox"
                checked={visibleCalendarIds.has(calendar.calendar_id)}
                onChange={() => toggleCalendar(calendar.calendar_id)}
                aria-label={`Show ${calendar.name}`}
                className="ui-checkbox shrink-0"
              />
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: calendar.color }}
              />
              <button
                type="button"
                onClick={() => setFocusedCalendarId(calendar.calendar_id)}
                className="min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-700"
                title={`Use ${calendar.name} for new events`}
              >
                {calendar.name}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(calendar)}
                disabled={busy}
                aria-label={`Delete ${calendar.name}`}
                title={`Delete ${calendar.name}`}
                className="shrink-0 rounded px-1 text-xs text-slate-400 opacity-0 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mt-2 space-y-2 rounded-md border border-slate-200 bg-white p-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Calendar name"
            aria-label="Calendar name"
            maxLength={120}
            autoFocus
            className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value.toUpperCase())}
              aria-label="Calendar color"
              className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
            />
            <button
              type="submit"
              disabled={busy}
              className="ml-auto rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Sidebar({
  calendars,
  visibleCalendarIds,
  setVisibleCalendarIds,
  focusedCalendarId,
  setFocusedCalendarId,
  onCreateCalendar,
  onDeleteCalendar,
  categories,
  setCategories,
  onAddEventClick,
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,
  events,
  budgetLimits,
  setBudgetLimits
}) {
  return (
    <aside
      className="sticky top-0 flex h-full w-64 flex-col overflow-y-auto border-r border-slate-200 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="p-3">
        <button
          onClick={onAddEventClick}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          New event
        </button>
      </div>

      <div className="px-3 pb-3">
        <MiniCalendar
          onDateClick={(date) => {
            setSelectedDate(date);
            setViewMode("day");
          }}
          viewMode={viewMode}
          selectedDate={selectedDate}
        />
      </div>

      <div className="border-t border-slate-200/60 px-3 py-3">
        <CalendarsSection
          calendars={calendars}
          visibleCalendarIds={visibleCalendarIds}
          setVisibleCalendarIds={setVisibleCalendarIds}
          focusedCalendarId={focusedCalendarId}
          setFocusedCalendarId={setFocusedCalendarId}
          onCreateCalendar={onCreateCalendar}
          onDeleteCalendar={onDeleteCalendar}
        />
      </div>

      <div className="border-t border-slate-200/60 px-3 py-3">
        <BudgetDashboard
          events={events}
          categories={categories}
          selectedDate={selectedDate}
          viewMode={viewMode}
          budgetLimits={budgetLimits}
          setBudgetLimits={setBudgetLimits}
        />
      </div>

      <div className="border-t border-slate-200/60 px-3 py-3">
        <CategoryManager
          categories={categories}
          setCategories={setCategories}
          calendarId={focusedCalendarId}
        />
      </div>
    </aside>
  );
}

export default Sidebar;
