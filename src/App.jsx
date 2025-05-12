// ✅ App.jsx
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";
import EventModal from "./components/EventModal";

function App() {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);

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

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  function handleSaveEvent({ title, budget, timeStart, timeEnd, category }) {
    if (selectedDay === null) {
      alert("Error: No day selected");
      return;
    }

    const fallbackTitle = title.trim() === "" ? "New Event" : title;
    const parsedBudget = parseFloat(budget);
    const roundedBudget = isNaN(parsedBudget)
      ? 0
      : parseFloat(parsedBudget.toFixed(2));

    const eventData = {
      day: selectedDay,
      title: fallbackTitle,
      budget: roundedBudget,
      timeStart:
        timeStart || `${selectedHour?.toString().padStart(2, "0")}:00`,
      timeEnd:
        timeEnd ||
        `${(selectedHour !== null ? selectedHour + 1 : 1)
          .toString()
          .padStart(2, "0")}:00`,
      category: category || "",
    };

    try {
      if (editingEvent) {
        eventData.id = editingEvent.id;
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEvent.id ? { ...event, ...eventData } : event
          )
        );
      } else {
        eventData.id = generateId();
        setEvents((prev) => [...prev, eventData]);
      }

      setEditingEvent(null);
      setIsEventModalOpen(false);
    } catch (e) {
      console.error("Error saving event:", e);
    }
  }

  function handleDeleteEvent(eventToDelete) {
    setEvents((prev) => prev.filter((event) => event !== eventToDelete));
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar
          categories={categories}
          setCategories={setCategories}
          onAddEventClick={() => {
            setEditingEvent(null);
            setIsDayModalOpen(false);
            setIsEventModalOpen(true);
          }}
        />

        <main className="flex-1 bg-white p-6 overflow-y-auto">
          <Calendar
            categories={categories}
            events={events}
            setEvents={setEvents}
            editingEvent={editingEvent}
            setEditingEvent={setEditingEvent}
            isEventModalOpen={isEventModalOpen}
            setIsEventModalOpen={setIsEventModalOpen}
            isDayModalOpen={isDayModalOpen}
            setIsDayModalOpen={setIsDayModalOpen}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            selectedHour={selectedHour}
            setSelectedHour={setSelectedHour}
            onSaveEvent={handleSaveEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
