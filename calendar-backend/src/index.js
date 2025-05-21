/* eslint-env node */

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getEvents, createEvent, updateEvent, deleteEvent } from './controllers/eventController.js';
import { getCategories, createCategory, deleteCategory } from './controllers/categoryController.js';

dotenv.config({ path: '../.env' });

console.log("Starting server...");
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to Postgres
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Health check
app.get('/', (req, res) => {
  res.send("🚀 Calendar API is running!");
});

// Event routes
app.get('/events', getEvents);
app.post('/events', createEvent);
app.put('/events/:id', updateEvent);
app.delete('/events/:id', deleteEvent);

// Category routes
app.get('/categories', getCategories);
app.post('/categories', createCategory);
app.delete('/categories/:id', deleteCategory);

// Start server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
