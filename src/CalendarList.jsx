import { useCallback, useEffect, useState } from "react";
import MainApp from "./MainApp";
import {
  createCalendar,
  deleteCalendar,
  fetchCalendars,
} from "./services/calendarService";

function CalendarList({ onLogout }) {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCalendars = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCalendars(await fetchCalendars());
    } catch (loadError) {
      setError(loadError.message || "Failed to load calendars");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  async function handleCreateCalendar(name, color) {
    const created = await createCalendar(name, color);
    setCalendars((current) => [...current, created]);
    return created;
  }

  async function handleDeleteCalendar(calendarId) {
    await deleteCalendar(calendarId);
    setCalendars((current) =>
      current.filter((calendar) => calendar.calendar_id !== calendarId)
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
        Loading calendars…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-800">Calendars could not be loaded.</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={loadCalendars}
            className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <MainApp
      calendars={calendars}
      onCreateCalendar={handleCreateCalendar}
      onDeleteCalendar={handleDeleteCalendar}
      onLogout={onLogout}
    />
  );
}

export default CalendarList;
