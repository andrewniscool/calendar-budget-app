import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all events for a user, joined with category info
export const getEvents = async (userID) => {
  try {
    const result = await db.query(
      `SELECT e.*, c.name AS category_name, c.color AS category_color
       FROM events e
       LEFT JOIN categories c ON e.category_id = c.category_id
       WHERE e.user_id = $1
       ORDER BY e.date, e.time_start`,
      [userID]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Create event with category_id
export const createEvent = async ({ title, date, timeStart, timeEnd, categoryId, budget }, userID) => {
  try {
    const result = await db.query(
      `INSERT INTO events (title, date, time_start, time_end, category_id, budget, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, date, timeStart, timeEnd, categoryId, budget, userID]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Update event, including category_id
export const updateEvent = async (id, userID, { title, date, timeStart, timeEnd, categoryId, budget }) => {
  try {
    const result = await db.query(
      `UPDATE events
       SET title = $1, date = $2, time_start = $3, time_end = $4, category_id = $5, budget = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, date, timeStart, timeEnd, categoryId, budget, id, userID]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

// Delete event for a user
export const deleteEvent = async (id, userID) => {
  try {
    const result = await db.query(
      'DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userID]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};
