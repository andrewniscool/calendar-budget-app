import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";

function EventModal({ isOpen, setIsOpen, onSave, editingEvent, onDelete, categories, selectedHour }) {
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setTitle(editingEvent.title || "");
        setBudget(editingEvent.budget || "");
        setTimeStart(editingEvent.timeStart || "");
        setTimeEnd(editingEvent.timeEnd || "");
        setCategory(editingEvent.category || "");
      } else {
        setTitle("");
        setBudget("");
        const now = new Date();
        const defaultStart = now.toTimeString().slice(0, 5);
        const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5);
        const start = selectedHour !== undefined ? selectedHour.toString().padStart(2, "0") + ":00" : defaultStart;
        const end = selectedHour !== undefined ? ((selectedHour + 1) % 24).toString().padStart(2, "0") + ":00" : defaultEnd;
        setTimeStart(start);
        setTimeEnd(end);
        setCategory("");
      }
    }
  }, [isOpen, editingEvent, selectedHour]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ title, budget, timeStart, timeEnd, category });
    setIsOpen(false);
  }

  function handleDelete() {
    if (editingEvent) {
      onDelete(editingEvent);
      setIsOpen(false);
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setIsOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-800 mb-4">
              {editingEvent ? "Edit Event" : "Add Event"}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  placeholder="Event title"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Budget ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  inputMode="decimal"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                >
                  <option value="">Select a category</option>
                  {categories.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Save
                </button>

                {editingEvent && (
                  <button
                    type="button"
                    className="text-red-600 border border-red-300 px-3 py-1.5 text-sm rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}

export default EventModal;
