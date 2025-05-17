/* eslint-env node */

console.log("Starting server...");
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config( {path: '../.env'} );

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to Postgres
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log("GET /events route is active");

app.get('/', (req, res) => {
  res.send("🚀 Calendar API is running!");
});

app.get('/events', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events ORDER BY date, time_start');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/events', async (req, res) => {
  const { title, date, timeStart, timeEnd, category, budget } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO events (title, date, time_start, time_end, category, budget)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, date, timeStart, timeEnd, category, budget]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error creating event:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

app.put('/events/:id', async (req, res) => {
  const { id } = req.params;
  const { title, date, timeStart, timeEnd, category, budget } = req.body;

  try {
    const result = await db.query(
      `UPDATE events
       SET title = $1, date = $2, time_start = $3, time_end = $4, category = $5, budget = $6
       WHERE id = $7
       RETURNING *`,
      [title, date, timeStart, timeEnd, category, budget, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating event:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
}
);
app.delete('/events/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error deleting event:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});