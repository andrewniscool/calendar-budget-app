const defaultSettings = {
  timezone: 'America/New_York',
};

function mapSettings(row, calendarId) {
  return {
    calendar_id: calendarId,
    timezone: row?.timezone ?? defaultSettings.timezone,
  };
}

export function createCalendarSettingsRepository(db) {
  return {
    async find(calendarId, userId) {
      const result = await db.query(
        `SELECT cs.timezone
         FROM calendars cal
         LEFT JOIN calendar_settings cs ON cs.calendar_id = cal.calendar_id
         WHERE cal.calendar_id = $1 AND cal.user_id = $2`,
        [calendarId, userId]
      );
      if (!result.rows[0]) return undefined;
      return mapSettings(result.rows[0], calendarId);
    },

    async upsert(calendarId, userId, data) {
      const result = await db.query(
        `INSERT INTO calendar_settings (calendar_id, timezone)
         SELECT $1, $2
         WHERE EXISTS (
           SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $3
         )
         ON CONFLICT (calendar_id)
           DO UPDATE SET timezone = EXCLUDED.timezone,
                         updated_at = CURRENT_TIMESTAMP
         RETURNING calendar_id, timezone`,
        [calendarId, data.timezone, userId]
      );
      return result.rows[0];
    },
  };
}
