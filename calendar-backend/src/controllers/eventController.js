// src/controllers/eventController.js
import * as eventModel from '../models/eventModel.js';

// Get all events
export const getEvents = async (req, res) => {
  try {
    const events = await eventModel.getEvents();  // Get events from model
    res.json(events);  // Send events back as the response
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Create a new event
export const createEvent = async (req, res) => {
  const { title, date, timeStart, timeEnd, category, budget } = req.body;  // Get event data from the request
  try {
    const newEvent = await eventModel.createEvent({ title, date, timeStart, timeEnd, category, budget });
    res.status(201).json(newEvent);  // Send the created event as the response
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  const { id } = req.params;  // Get event ID from the URL
  const { title, date, timeStart, timeEnd, category, budget } = req.body;  // Get updated event data from the request
  try {
    const updatedEvent = await eventModel.updateEvent(id, { title, date, timeStart, timeEnd, category, budget });
    res.json(updatedEvent);  // Send the updated event back as the response
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  const { id } = req.params;  // Get event ID from the URL
  try {
    const deletedEvent = await eventModel.deleteEvent(id);  // Delete event from the model
    res.json(deletedEvent);  // Send the deleted event back as the response
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
