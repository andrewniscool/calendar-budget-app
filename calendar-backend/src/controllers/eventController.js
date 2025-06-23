import * as eventModel from '../models/eventModel.js';

// Get all events for the logged-in user
export const getEvents = async (req, res) => {
  try {
    const events = await eventModel.getEvents(req.user.id);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Create a new event for the logged-in user
export const createEvent = async (req, res) => {
  const { title, date, timeStart, timeEnd, categoryId, budget } = req.body;
  try {
    const newEvent = await eventModel.createEvent(
      { title, date, timeStart, timeEnd, categoryId, budget },
      req.user.id
    );
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update an event belonging to the logged-in user
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, date, timeStart, timeEnd, categoryId, budget } = req.body;
  try {
    const updatedEvent = await eventModel.updateEvent(
      id,
      req.user.id,
      { title, date, timeStart, timeEnd, categoryId, budget }
    );
    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete an event belonging to the logged-in user
export const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedEvent = await eventModel.deleteEvent(id, req.user.id);
    res.json(deletedEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
