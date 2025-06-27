import { db } from '../index.js';

// Get all calendars for a user
export const getCalendars = async (userId) => {
  const result = await db.query(
    'SELECT calendar_id, name, created_at FROM calendars WHERE user_id = $1 ORDER BY created_at',
    [userId]
  );
  return result.rows;
};

// Create a new calendar
export const createCalendar = async (userId, name) => {
  const result = await db.query(
    'INSERT INTO calendars (user_id, name) VALUES ($1, $2) RETURNING calendar_id, name, created_at',
    [userId, name]
  );
  return result.rows[0];
};

// Delete a calendar
export const deleteCalendar = async (calendarId, userId) => {
  const result = await db.query(
    'DELETE FROM calendars WHERE calendar_id = $1 AND user_id = $2 RETURNING *',
    [calendarId, userId]
  );
  return result.rows[0];
};
