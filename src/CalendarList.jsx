import React, { useEffect, useState } from 'react';
import { fetchCalendars, createCalendar, deleteCalendar } from './services/calendarService';
import MainApp from './MainApp';

function CalendarList() {
  const [calendars, setCalendars] = useState([]);
  const [newName, setNewName] = useState('');
  const [selectedCalendar, setSelectedCalendar] = useState(null);

  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    const data = await fetchCalendars();
    setCalendars(data);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCalendar(newName);
    setNewName('');
    loadCalendars();
  };

  const handleDelete = async (id) => {
    await deleteCalendar(id);
    loadCalendars();
  };

  const handleSelectCalendar = (calendar) => {
    setSelectedCalendar(calendar);
  } 
    
  if(selectedCalendar) {
    return <MainApp calendarId={selectedCalendar.calendar_id} />;
  }
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Your Calendars</h2>
      <ul className="space-y-2">
        {calendars.map((cal) => (
          <li key={cal.calendar_id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
            <button onClick={() => handleSelectCalendar(cal)}>{cal.name}</button>
            <button onClick={() => handleDelete(cal.calendar_id)} className="text-red-500 hover:underline">Delete</button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <input
          className="border px-2 py-1 w-full"
          placeholder="New calendar name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={handleCreate} className="bg-blue-500 text-white px-3 py-1 rounded">Add</button>
      </div>
    </div>
  );
}

export default CalendarList;