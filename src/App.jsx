import { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";

function App() {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

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

  useEffect(() => {
    fetch("http://localhost:3001/events")
      .then((res) => res.json())
      .then((data) => {
        const mappedEvents = data.map((event) => ({
          ...event,
          timeStart: event.time_start,
          timeEnd: event.time_end,
        }));
        console.log("✅ Mapped events:", mappedEvents);
        setEvents(mappedEvents);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
      });
  }, []);

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

    try {
      if (editingEvent) {
        // Handle update later (via PUT)
        eventData.id = editingEvent.id;
        setEvents((prev) =>
          prev.map((event) =>
            event.id === editingEvent.id ? { ...event, ...eventData } : event
          )
        );
      } else {
        fetch("http://localhost:3001/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        })
          .then((res) => res.json())
          .then((newEvent) => {
            const mappedEvent = {
              ...newEvent,
              id: newEvent.id,
              title: newEvent.title,
              date: newEvent.date,
              category: newEvent.category,
              budget: newEvent.budget,
              timeStart: newEvent.time_start,
              timeEnd: newEvent.time_end,
            };
            setEvents((prev) => [...prev, mappedEvent]);
          })
          .catch((err) => {
            console.error("Error saving event to backend:", err);
          });
      }

      setEditingEvent(null);
      setIsEventModalOpen(false);
    } catch (e) {
      console.error("Error saving event:", e);
    }
  }

  function handleDeleteEvent(eventToDelete) {
    fetch(`http://localhost:3001/events/${eventToDelete.id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
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

    // setModalPosition({
    //   top: window.innerHeight / 2 + window.scrollY,
    //   left: window.innerWidth / 2 + window.scrollX,
    // })
    setEditingEvent(null);
    setIsEventModalOpen(true);
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 bg-gray-50 rounded-xl m-4 overflow-hidden shadow">
        <Sidebar
          categories={categories}
          setCategories={setCategories}
          onAddEventClick={handleAddEventClick}
        />
        <main className="flex-1 h-full overflow-hidden">
          <Calendar
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
