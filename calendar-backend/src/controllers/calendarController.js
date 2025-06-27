import * as calendarModel from '../models/calendarModel.js';

export const getCalendars = async (req, res) => {
  try {
    const calendars = await calendarModel.getCalendars(req.user.id);
    res.json(calendars);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calendars' });
  }
};

export const createCalendar = async (req, res) => {
  const { name } = req.body;
  try {
    const calendar = await calendarModel.createCalendar(req.user.id, name);
    res.status(201).json(calendar);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create calendar' });
  }
};

export const deleteCalendar = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await calendarModel.deleteCalendar(id, req.user.id);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete calendar' });
  }
};
