/* eslint-env node */

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getEvents, createEvent, updateEvent, deleteEvent } from './controllers/eventController.js';
import { getCategories, createCategory, deleteCategory, deleteAllCategories } from './controllers/categoryController.js';
import { authenticate } from './middleware/authMiddleware.js';
import { login, register } from './controllers/userController.js';
import { getCalendars, createCalendar, deleteCalendar } from './controllers/calendarController.js';

dotenv.config({ path: '../.env' });

console.log("Starting server...");
const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Connect to Postgres
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
db.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('✅ Connected to database');
    release();
  }
});

// Health check
app.get('/', (req, res) => {
  res.send("🚀 Calendar API is running!");
});

// Authentication routes (no auth required)
app.post('/login', login); 
app.post('/register', register);

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

// Calendar routes
app.get('/calendars', authenticate, getCalendars);
app.post('/calendars', authenticate, createCalendar); 
app.delete('/calendars/:id', authenticate, deleteCalendar);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});