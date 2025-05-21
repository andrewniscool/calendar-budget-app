// src/models/eventModel.js
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const getEvents = async () => {
  try {
    const result = await db.query('SELECT * FROM events ORDER BY date, time_start');
    return result.rows;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const createEvent = async ({ title, date, timeStart, timeEnd, category, budget }) => {
  try {
    const result = await db.query(
      `INSERT INTO events (title, date, time_start, time_end, category, budget)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, date, timeStart, timeEnd, category, budget]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id, { title, date, timeStart, timeEnd, category, budget }) => {
  try {
    const result = await db.query(
      `UPDATE events
       SET title = $1, date = $2, time_start = $3, time_end = $4, category = $5, budget = $6
       WHERE id = $7
       RETURNING *`,
      [title, date, timeStart, timeEnd, category, budget, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};
