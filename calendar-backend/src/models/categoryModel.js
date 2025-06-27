import { db } from '../index.js'; // Added missing import

export const getCategoriesByCalendar = async (calendarId, userId) => {
  try {
    const result = await db.query(
      `SELECT c.category_id, c.name, c.color
       FROM categories c
       JOIN calendars cal ON c.calendar_id = cal.calendar_id
       WHERE cal.calendar_id = $1 AND cal.user_id = $2
       ORDER BY c.name`,
      [calendarId, userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async ({ name, color, calendarId, userId }) => {
  try {
    // Verify calendar belongs to user
    const check = await db.query(
      `SELECT * FROM calendars WHERE calendar_id = $1 AND user_id = $2`,
      [calendarId, userId]
    );
    if (check.rowCount === 0) throw new Error('Unauthorized calendar access');

    const result = await db.query(
      `INSERT INTO categories (calendar_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING category_id, name, color`,
      [calendarId, name, color]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId, userId) => {
  try {
    const result = await db.query(
      `DELETE FROM categories
       WHERE category_id = $1 AND calendar_id IN (
         SELECT calendar_id FROM calendars WHERE user_id = $2
       )
       RETURNING *`,
      [categoryId, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

export const deleteAllCategories = async (calendarId, userId) => {
  try {
    await db.query(
      `DELETE FROM categories
       WHERE calendar_id = $1 AND calendar_id IN (
         SELECT calendar_id FROM calendars WHERE user_id = $2
       )`,
      [calendarId, userId]
    );
  } catch (error) {
    console.error('Error deleting all categories:', error);
    throw error;
  }
};
