// src/models/eventModel.js (Backend)

const { Pool } = require('pg');
const db = new Pool({
  connectionString: process.env.DATABASE_URL, // Load the connection string from .env
});

// Get all events from the database
const getEvents = async () => {
  try {
    const result = await db.query('SELECT * FROM events ORDER BY date, time_start');
    return result.rows; // Return all events as an array of objects
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error; // Throw the error to be handled by the controller
  }
};

// Create a new event in the database
const createEvent = async (eventData) => {
  const { title, date, timeStart, timeEnd, category, budget } = eventData;

  try {
    const result = await db.query(
      `INSERT INTO events (title, date, time_start, time_end, category, budget)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, // Insert the event into the database
      [title, date, timeStart, timeEnd, category, budget] // Pass in the values for the event
    );
    return result.rows[0]; // Return the newly created event
  } catch (error) {
    console.error('Error creating event:', error);
    throw error; // Throw the error to be handled by the controller
  }
};

// Update an existing event in the database
const updateEvent = async (id, eventData) => {
  const { title, date, timeStart, timeEnd, category, budget } = eventData;

  try {
    const result = await db.query(
      `UPDATE events
       SET title = $1, date = $2, time_start = $3, time_end = $4, category = $5, budget = $6
       WHERE id = $7
       RETURNING *`, // Update the event with the provided data
      [title, date, timeStart, timeEnd, category, budget, id] // Pass in the new values and the event ID
    );
    return result.rows[0]; // Return the updated event
  } catch (error) {
    console.error('Error updating event:', error);
    throw error; // Throw the error to be handled by the controller
  }
};

// Delete an event from the database
const deleteEvent = async (id) => {
  try {
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]); // Delete the event by ID
    return result.rows[0]; // Return the deleted event (if any)
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error; // Throw the error to be handled by the controller
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
