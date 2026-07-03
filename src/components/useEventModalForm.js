import { useEffect, useState } from "react";

function defaultDate() {
  return new Date().toISOString().split("T")[0];
}

function defaultTimeRange(selectedHour) {
  if (selectedHour !== undefined) {
    return {
      timeStart: `${selectedHour.toString().padStart(2, "0")}:00`,
      timeEnd: `${((selectedHour + 1) % 24).toString().padStart(2, "0")}:00`,
    };
  }

  const now = new Date();
  return {
    timeStart: now.toTimeString().slice(0, 5),
    timeEnd: new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5),
  };
}

export function useEventModalForm({ isOpen, editingEvent, selectedDate, selectedHour }) {
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(editingEvent?.date || defaultDate());

  useEffect(() => {
    if (!isOpen) return;

    if (editingEvent) {
      setDate(new Date(editingEvent.date).toISOString().split("T")[0]);
      setTitle(editingEvent.title || "");
      setBudget(editingEvent.budget || "");
      setTimeStart(editingEvent.timeStart || "");
      setTimeEnd(editingEvent.timeEnd || "");
      setCategoryId(String(editingEvent.categoryId || ""));
      return;
    }

    const range = defaultTimeRange(selectedHour);
    setDate(selectedDate || defaultDate());
    setTitle("");
    setBudget("");
    setTimeStart(range.timeStart);
    setTimeEnd(range.timeEnd);
    setCategoryId("");
  }, [isOpen, editingEvent, selectedHour, selectedDate]);

  return {
    values: { title, date, budget, timeStart, timeEnd, categoryId },
    setters: { setTitle, setDate, setBudget, setTimeStart, setTimeEnd, setCategoryId },
  };
}
