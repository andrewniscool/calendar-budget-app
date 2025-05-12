import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {motion} from "framer-motion"

function DayModal({ isOpen, setIsOpen, day, events, onAddClick, onEditClick, onDelete }) {
  const totalBudget = events.reduce((sum, e) => sum + Number(e.budget), 0);

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
              Events for Day {day}
            </Dialog.Title>

            {/* ✅ Scrollable event list wrapper INSIDE Panel */}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <p className="text-sm text-gray-500">No events for this day.</p>
              ) : (
                events.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex justify-between items-center p-2 border rounded-md bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{event.title}</div>
                      {event.budget > 0 && (
                      <div className="text-xs text-gray-600">${event.budget}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        onClick={() => onEditClick(event)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 border border-red-300 px-3 py-1.5 text-sm rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                        onClick={() => onDelete(event)}
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="text-right text-sm text-gray-700 font-medium mt-4">
              Total Budget: ${totalBudget.toFixed(2)}
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                onClick={() => onAddClick(day)}
              >
                Add Event
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}

export default DayModal;
