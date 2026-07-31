import React from 'react';
import WeekView from './ViewModes/WeekView';
import DayView from './ViewModes/DayView';
import MonthView from './ViewModes/MonthView';
import YearView from './ViewModes/YearView';

import { useState } from 'react';

function Calendar({
    viewMode,
    setViewMode,
    calendars,
    categories,
    currency,
    defaultEventCalendarId,
    canCreateEvent,
    onCreateBlocked,
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
    modalAnchorRect,
    setModalAnchorRect,
}) {
  const [pendingEvent, setPendingEvent] = useState(null);
  
  switch (viewMode) {
    case 'day':
      // return <DayView {...props} />;
      return (
        <DayView
          calendars={calendars}
          categories={categories}
          currency={currency}
          defaultEventCalendarId={defaultEventCalendarId}
          canCreateEvent={canCreateEvent}
          onCreateBlocked={onCreateBlocked}
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
          modalAnchorRect={modalAnchorRect}
          setModalAnchorRect={setModalAnchorRect}
          pendingEvent={pendingEvent}
          setPendingEvent={setPendingEvent}
        />
      );
    case 'month':
      return (
        <MonthView
          calendars={calendars}
          categories={categories}
          currency={currency}
          defaultEventCalendarId={defaultEventCalendarId}
          canCreateEvent={canCreateEvent}
          onCreateBlocked={onCreateBlocked}
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
          modalAnchorRect={modalAnchorRect}
          setModalAnchorRect={setModalAnchorRect}
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
          calendars={calendars}
          categories={categories}
          currency={currency}
          defaultEventCalendarId={defaultEventCalendarId}
          canCreateEvent={canCreateEvent}
          onCreateBlocked={onCreateBlocked}
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
          modalAnchorRect={modalAnchorRect}
          setModalAnchorRect={setModalAnchorRect}
          pendingEvent={pendingEvent}
          setPendingEvent={setPendingEvent}
        />
      );
  }
}
export default Calendar;
