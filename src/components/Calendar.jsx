import React from 'react';
import WeekView from './ViewModes/WeekView';
import DayView from './ViewModes/DayView';
import MonthView from './ViewModes/MonthView';
//import YearView from './YearView';

function Calendar({
    viewMode,
    setViewMode,
    categories,
    events,
    editingEvent,
    setEditingEvent,
    isEventModalOpen,
    setIsEventModalOpen,
    selectedDate,
    setSelectedDate,
    selectedHour,
    setSelectedHour,
    onSaveEvent,
    onDeleteEvent,
    modalPosition,
    setModalPosition,
}) {
  
  switch (viewMode) {
    case 'day':
      // return <DayView {...props} />;
      return (
        <DayView
          categories={categories}
          events={events}
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
          isEventModalOpen={isEventModalOpen}
          setIsEventModalOpen={setIsEventModalOpen}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedHour={selectedHour}
          setSelectedHour={setSelectedHour}
          onSaveEvent={onSaveEvent}
          onDeleteEvent={onDeleteEvent}
          modalPosition={modalPosition}
          setModalPosition={setModalPosition}
        />
      );
    case 'month':
      return (
        <MonthView
          setViewMode={setViewMode}
          setSelectedDate={setSelectedDate}
          
        />
      );
    case 'year':
      // return <YearView {...props} />;
      return <div>Year View is not implemented yet.</div>;
    default:
      return (
        <WeekView
          categories={categories}
          events={events}
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
          isEventModalOpen={isEventModalOpen}
          setIsEventModalOpen={setIsEventModalOpen}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedHour={selectedHour}
          setSelectedHour={setSelectedHour}
          onSaveEvent={onSaveEvent}
          onDeleteEvent={onDeleteEvent}
          modalPosition={modalPosition}
          setModalPosition={setModalPosition}
        />
      );
  }
}
export default Calendar;