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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Calendars</h1>
          <p className="text-gray-600">Manage and organize your calendar collections</p>
        </div>

        {/* Create New Calendar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Calendar</h2>
          <div className="flex gap-3">
            <input
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400"
              placeholder="Enter calendar name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button 
              onClick={handleCreate}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Create
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {calendars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {calendars.map((cal) => (
              <div 
                key={cal.calendar_id} 
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:scale-105"
              >
                {/* Calendar Card */}
                <div className="p-6">
                  {/* Calendar Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  {/* Calendar Name */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                    {cal.name}
                  </h3>
                  
                  {/* Calendar ID */}
                  <p className="text-sm text-gray-500 mb-4">
                    ID: {cal.calendar_id}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSelectCalendar(cal)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => handleDelete(cal.calendar_id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No calendars yet</h3>
            <p className="text-gray-500">Create your first calendar to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarList;