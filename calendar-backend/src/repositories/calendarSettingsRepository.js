const defaultSettings = {
  timezone: 'America/New_York',
  currency: 'USD',
};

function mapSettings(row, calendarId) {
  return {
    calendar_id: calendarId,
    timezone: row?.timezone ?? defaultSettings.timezone,
    currency: row?.currency ?? defaultSettings.currency,
  };
}

export function createCalendarSettingsRepository(db) {
  return {
    async find(calendarId, userId) {
      const result = await db.query(
        `SELECT cs.timezone, cs.currency
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
        `INSERT INTO calendar_settings (calendar_id, timezone, currency)
         SELECT $1, $2, $3
         WHERE EXISTS (
           SELECT 1 FROM calendars WHERE calendar_id = $1 AND user_id = $4
         )
         ON CONFLICT (calendar_id)
           DO UPDATE SET timezone = EXCLUDED.timezone,
                         currency = EXCLUDED.currency,
                         updated_at = CURRENT_TIMESTAMP
         RETURNING calendar_id, timezone, currency`,
        [calendarId, data.timezone, data.currency, userId]
      );
      return result.rows[0];
    },
  };
}
