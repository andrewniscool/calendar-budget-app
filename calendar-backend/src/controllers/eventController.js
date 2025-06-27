import * as eventModel from '../models/eventModel.js'; // Added missing import

// Get all events in a calendar
export const getEvents = async (req, res) => {
  const { calendarId } = req.query;
  try {
    const events = await eventModel.getEvents(calendarId, req.user.id);
    res.json(events);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Create a new event in a calendar
export const createEvent = async (req, res) => {
  console.log('Creating event with body:', req.body);
  const { title, date, timeStart, timeEnd, categoryId, budget, calendarId } = req.body;
  
  // Input validation
  if (!title || !date || !calendarId) {
    return res.status(400).json({ error: 'Title, date, and calendarId are required' });
  }
  
  try {
    const newEvent = await eventModel.createEvent(
      { title, date, timeStart, timeEnd, categoryId, budget, calendarId },
      req.user.id
    );
    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, date, timeStart, timeEnd, categoryId, budget } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }
  
  try {
    const updatedEvent = await eventModel.updateEvent(
      id,
      req.user.id,
      { title, date, timeStart, timeEnd, categoryId, budget }
    );
    
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }
    
    res.json(updatedEvent);
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }
  
  try {
    const deletedEvent = await eventModel.deleteEvent(id, req.user.id);
    
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }
    
    res.json(deletedEvent);
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

