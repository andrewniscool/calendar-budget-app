import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

const EventModal = forwardRef(function EventModal({
  isOpen,
  setIsOpen,
  onSave,
  onDelete,
  editingEvent,
  categories,
  selectedHour,
  clickCoords,
  selectedDate,
  modalPosition,
  setModalPosition,
  setPendingEvent
}, ref) {
  const modalRef = useRef();
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(editingEvent?.date || new Date().toISOString().split("T")[0]);

  useImperativeHandle(ref, () => ({
    getSize: () => {
      const rect = modalRef.current?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height } : { width: 300, height: 350 };
    }
  }));

  useEffect(() => {
    if (isOpen && clickCoords && modalRef.current) {
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      const padding = 8;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      let left = clickCoords.x + padding;
      let top;

      if (left + modalWidth > screenWidth) {
        left = clickCoords.x - modalWidth - padding;
      }

      if (clickCoords.y + modalHeight + padding > screenHeight) {
        top = clickCoords.y - modalHeight - padding;
      } else {
        top = clickCoords.y + padding;
      }

      top = Math.max(top, padding);
      setModalPosition({ top: top + window.scrollY, left: left + window.scrollX });
    }
  }, [isOpen, clickCoords, setModalPosition]);

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setDate(new Date(editingEvent.date).toISOString().split("T")[0]);
        setTitle(editingEvent.title || "");
        setBudget(editingEvent.budget || "");
        setTimeStart(editingEvent.timeStart || "");
        setTimeEnd(editingEvent.timeEnd || "");
        setCategory(editingEvent.category || "");
      } else {
        const defaultDate = selectedDate || new Date().toISOString().split("T")[0];
        const now = new Date();
        const defaultStart = now.toTimeString().slice(0, 5);
        const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);
        const start = selectedHour !== undefined
          ? selectedHour.toString().padStart(2, "0") + ":00"
          : defaultStart;
        const end = selectedHour !== undefined
          ? ((selectedHour + 1) % 24).toString().padStart(2, "0") + ":00"
          : defaultEnd;

        setDate(defaultDate);
        setTitle("");
        setBudget("");
        setTimeStart(start);
        setTimeEnd(end);
        setCategory("");
      }
    }
  }, [isOpen, editingEvent, selectedHour, selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      setPendingEvent?.(null);
    }
  }, [isOpen, setPendingEvent]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ title, date, budget, timeStart, timeEnd, category });
    setIsOpen(false);
  }

  function handleDelete() {
    if (editingEvent) {
      onDelete(editingEvent);
      setIsOpen(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bg-white border shadow-md rounded-md p-4 z-50 w-72"
            style={{ top: modalPosition?.top || 100, left: modalPosition?.left || 100 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">
                {editingEvent ? "Edit Event" : "Add Event"}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl leading-none">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  className="w-full mt-1 border rounded px-2 py-1 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  className="w-full mt-1 border rounded px-2 py-1 text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Budget</label>
                <input
                  type="number"
                  className="w-full mt-1 border rounded px-2 py-1 text-sm"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    className="w-full mt-1 border rounded px-2 py-1 text-sm"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    className="w-full mt-1 border rounded px-2 py-1 text-sm"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  className="w-full mt-1 border rounded px-2 py-1 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat, i) => (
                    <option key={i} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Save
                </button>
                {editingEvent && (
                  <button
                    type="button"
                    className="text-red-600 text-sm hover:underline"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default EventModal;
