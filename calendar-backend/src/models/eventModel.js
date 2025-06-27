import { db } from '../index.js'; // Added missing import

export const getEvents = async (calendarId, userId) => {
  try {
    const result = await db.query(
      `SELECT e.*, c.name AS category_name, c.color AS category_color
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.category_id
       JOIN calendars cal ON e.calendar_id = cal.calendar_id
       WHERE cal.calendar_id = $1 AND cal.user_id = $2
       ORDER BY e.date, e.time_start`,
      [calendarId, userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const createEvent = async ({ title, date, timeStart, timeEnd, categoryId, budget, calendarId }, userId) => {
  try {
    const check = await db.query(
      `SELECT * FROM calendars WHERE calendar_id = $1 AND user_id = $2`,
      [calendarId, userId]
    );
    if (check.rowCount === 0) throw new Error('Unauthorized calendar access');

    const result = await db.query(
      `INSERT INTO events (title, date, time_start, time_end, category_id, budget, calendar_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, date, timeStart, timeEnd, categoryId, budget, calendarId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id, userId, { title, date, timeStart, timeEnd, categoryId, budget }) => {
  try {
    const result = await db.query(
      `UPDATE events
       SET title = $1, date = $2, time_start = $3, time_end = $4, category_id = $5, budget = $6
       WHERE id = $7 AND calendar_id IN (
         SELECT calendar_id FROM calendars WHERE user_id = $8
       )
       RETURNING *`,
      [title, date, timeStart, timeEnd, categoryId, budget, id, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id, userId) => {
  try {
    const result = await db.query(
      `DELETE FROM events
       WHERE id = $1 AND calendar_id IN (
         SELECT calendar_id FROM calendars WHERE user_id = $2
       )
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};
