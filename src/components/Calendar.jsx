import React from 'react';
import WeekView from './ViewModes/WeekView';
import DayView from './ViewModes/DayView';
import MonthView from './ViewModes/MonthView';
import YearView from './ViewModes/YearView';

import { useState } from 'react';

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
  const [pendingEvent, setPendingEvent] = useState(null);
  
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
          pendingEvent={pendingEvent}
          setPendingEvent={setPendingEvent}
        />
      );
    case 'month':
      return (
        <MonthView
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
          viewMode={viewMode}
          setViewMode={setViewMode}
          pendingEvent={pendingEvent}
          setPendingEvent={setPendingEvent}

        />
      );
    case 'year':
      return (
      <YearView
        setSelectedDate={setSelectedDate}
        setViewMode={setViewMode}
        selectedDate={selectedDate}
      />
    );
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
          pendingEvent={pendingEvent}
          setPendingEvent={setPendingEvent}
        />
      );
  }
}
export default Calendar;