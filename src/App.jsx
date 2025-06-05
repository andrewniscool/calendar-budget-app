// App.jsx
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";
import { fetchEvents, saveEvent, deleteEvent } from "./services/eventService"; // Import service

function App() {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [viewMode, setViewMode] = useState("week"); // default to 'week'


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

  // Fetch events from the backend
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

  // Handle saving events (add or update)
  function handleSaveEvent({ title, budget, timeStart, timeEnd, category, date }) {
    if (!date) {
      alert("Error: No day selected");
      return;
    }

    const fallbackTitle = title.trim() === "" ? "New Event" : title;
    const parsedBudget = parseFloat(budget);
    const roundedBudget = isNaN(parsedBudget)
      ? 0
      : parseFloat(parsedBudget.toFixed(2));

    const eventData = {
      title: fallbackTitle,
      budget: roundedBudget,
      timeStart: timeStart || `${selectedHour?.toString().padStart(2, "0")}:00`,
      timeEnd:
        timeEnd ||
        `${(selectedHour !== null ? selectedHour + 1 : 1)
          .toString()
          .padStart(2, "0")}:00`,
      category: category || "",
      date: date,
    };
    // console.log("Event data:", eventData);

    try {
      if (editingEvent) {
        // Update event
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
        // Add new event
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

  // Handle deleting an event
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
      <Header viewMode={viewMode} setViewMode={setViewMode} />

      <div className="flex flex-1 bg-gray-50 rounded-xl m-4 overflow-hidden shadow">
        <Sidebar
          categories={categories}
          setCategories={setCategories}
          onAddEventClick={handleAddEventClick}
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        <main className="flex-1 h-full overflow-hidden">
          <Calendar
            viewMode={viewMode}
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
