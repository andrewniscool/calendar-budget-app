import React from 'react';
import WeekView from './WeekView';
import DayView from './DayView';
//import DayView from './DayView';
//import MonthView from './MonthView';
//import YearView from './YearView';

function Calendar({
    viewMode,
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
  
if (viewMode === 'day') {
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
  }
  else if (viewMode === 'month') {
    // return <MonthView {...props} />;
    return <div>Month View is not implemented yet.</div>;
  }
  else if (viewMode === 'year') {
    // return <YearView {...props} />;
    return <div>Year View is not implemented yet.</div>;
  }
  else{
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