import { useState, useEffect } from "react";
import dayjs from "dayjs";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";
import { fetchEvents, saveEvent, deleteEvent } from "./services/eventService";

function mapEventFromApi(event) {
  return {
    ...event,
    timeStart: event.timeStart ?? event.time_start,
    timeEnd: event.timeEnd ?? event.time_end,
    categoryId: event.categoryId ?? event.category_id ?? "",
    categoryName: event.categoryName ?? event.category_name ?? event.category ?? "Uncategorized",
    categoryColor: event.categoryColor ?? event.category_color ?? "",
  };
}

function MainApp({ calendarId, onLogout }) {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedHour, setSelectedHour] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [viewMode, setViewMode] = useState("week");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [categories, setCategories] = useState([  ]);

  const [budgetLimits, setBudgetLimits] = useState({
    overall: 1000,
    Work: 300,
    Food: 200,
    Study: 150,
    Uncategorized: 100,
  });

  useEffect(() => {
    const getEvents = async () => {
      try {
        const data = await fetchEvents(calendarId);
        const mappedEvents = data.map(mapEventFromApi);
        setEvents(mappedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    getEvents();
  }, [calendarId]);

  async function handleSaveEvent({ title, budget, timeStart, timeEnd, categoryId, date }) {
    if (!date) {
      alert("Error: No day selected");
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
      if (editingEvent) {
        eventData.id = editingEvent.id;
        const updatedEvent = await saveEvent(eventData);
        const mappedEvent = mapEventFromApi(updatedEvent);
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEvent.id ? { ...event, ...mappedEvent } : event
          )
        );
      } else {
        const newEvent = await saveEvent(eventData);
        const mappedEvent = mapEventFromApi(newEvent);
        setEvents((prev) => [...prev, mappedEvent]);
      }
      setEditingEvent(null);
      setIsEventModalOpen(false);
    } catch (e) {
      console.error("Error saving event:", e);
    }
  }

  function handleDeleteEvent(eventToDelete) {
    deleteEvent(eventToDelete.id)
      .then(() => {
        setEvents((prev) => prev.filter((event) => event.id !== eventToDelete.id));
      })
      .catch((err) => {
        console.error("Error deleting event:", err);
      });
  }

  function handleAddEventClick() {
    const now = new Date();
    const hour = now.getHours();
    setSelectedDate(now.toISOString().split("T")[0]);
    setSelectedHour(hour);
    setEditingEvent(null);
    setIsEventModalOpen(true);
  }

  return (
    <div className="h-screen flex flex-col">
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onLogout={onLogout}
      />
      <div className="flex flex-1 min-h-0 bg-white border border-slate-200 rounded-lg m-3 overflow-hidden">
        <div className={`transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-0"} overflow-hidden`}>
          <Sidebar
            calendarId = {calendarId}
            categories={categories}
            setCategories={setCategories}
            onAddEventClick={handleAddEventClick}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            events={events}
            budgetLimits={budgetLimits}
            setBudgetLimits={setBudgetLimits}
          />
        </div>
        <main className="flex-1 h-full overflow-hidden">
          <Calendar
            viewMode={viewMode}
            setViewMode={setViewMode}
            categories={categories}
            events={events}
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
          />
        </main>
      </div>
    </div>
  );
}

export default MainApp;
