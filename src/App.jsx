import { useState, useEffect } from "react";
import dayjs from "dayjs";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";
import { fetchEvents, saveEvent, deleteEvent } from "./services/eventService";


function App() {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedHour, setSelectedHour] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [viewMode, setViewMode] = useState("week");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);


  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("categories");
    return saved
      ? JSON.parse(saved)
      : [
          { name: "Work", color: "#CB7876", visible: true },
          { name: "Food", color: "#B4CFA4", visible: true },
          { name: "Study", color: "#8BA47C", visible: true },
        ];
  });

  const [budgetLimits, setBudgetLimits] = useState({
    overall: 1000,
    Work: 300,
    Food: 200,
    Study: 150,
    Uncategorized: 100,
  });

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    const getEvents = async () => {
      try {
        const data = await fetchEvents();
        const mappedEvents = data.map((event) => ({
          ...event,
          timeStart: event.time_start,
          timeEnd: event.time_end,
        }));
        setEvents(mappedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    };
    getEvents();
  }, []);

  function handleSaveEvent({ title, budget, timeStart, timeEnd, category, date }) {
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
        timeEnd ??
        `${(selectedHour !== null ? selectedHour + 1 : 1).toString().padStart(2, "0")}:00`,
      category: category ?? "",
      date: date,
    };

    try {
      if (editingEvent) {
        eventData.id = editingEvent.id;
        saveEvent(eventData).then((updatedEvent) => {
          const mappedEvent = {
            ...updatedEvent,
            timeStart: updatedEvent.time_start,
            timeEnd: updatedEvent.time_end,
          };
          setEvents((prev) =>
            prev.map((event) =>
              event.id === editingEvent.id ? { ...event, ...mappedEvent } : event
            )
          );
        });
      } else {
        saveEvent(eventData).then((newEvent) => {
          const mappedEvent = {
            ...newEvent,
            timeStart: newEvent.time_start,
            timeEnd: newEvent.time_end,
          };
          setEvents((prev) => [...prev, mappedEvent]);
        });
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
      />
      <div className="flex flex-1 bg-gray-50 rounded-xl m-4 overflow-hidden shadow">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
          <Sidebar
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
            setEvents={setEvents}
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

export default App;
