/* eslint-env node */

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getEvents, createEvent, updateEvent, deleteEvent } from './controllers/eventController.js';
import { getCategories, createCategory, deleteCategory, deleteAllCategories } from './controllers/categoryController.js';
import { authenticate } from './middleware/authMiddleware.js';
import { login, register } from './controllers/userController.js';

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
app.get('/events', authenticate, getEvents);
app.post('/events', authenticate, createEvent);
app.put('/events/:id', authenticate, updateEvent);
app.delete('/events/:id', authenticate, deleteEvent);

// Category routes
app.get('/categories', authenticate, getCategories);
app.post('/categories', authenticate, createCategory);
app.delete('/categories/all', authenticate, deleteAllCategories); 
app.delete('/categories/:id', authenticate, deleteCategory);

// Authentication middleware
app.post('/login', login); 
app.post('/register', register);

// Start server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
