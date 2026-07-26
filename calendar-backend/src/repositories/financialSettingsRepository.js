const defaultCurrency = 'USD';

function mapSettings(row) {
  return { currency: row?.currency ?? defaultCurrency };
}

export function createFinancialSettingsRepository(db) {
  return {
    async find(userId) {
      const result = await db.query(
        'SELECT currency FROM financial_settings WHERE user_id = $1',
        [userId]
      );
      return mapSettings(result.rows[0]);
    },

    async upsert(userId, { currency }) {
      const result = await db.query(
        `INSERT INTO financial_settings (user_id, currency)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
           DO UPDATE SET currency = EXCLUDED.currency,
                         updated_at = CURRENT_TIMESTAMP
         RETURNING currency`,
        [userId, currency]
      );
      return mapSettings(result.rows[0]);
    },
  };
}
