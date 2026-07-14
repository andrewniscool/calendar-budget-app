export async function cleanupExpiredAuthTokens(db) {
  const refresh = await db.query(
    `DELETE FROM refresh_tokens
     WHERE expires_at <= CURRENT_TIMESTAMP
        OR revoked_at < CURRENT_TIMESTAMP - INTERVAL '30 days'`
  );
  const account = await db.query(
    `DELETE FROM account_tokens
     WHERE expires_at <= CURRENT_TIMESTAMP
        OR consumed_at < CURRENT_TIMESTAMP - INTERVAL '30 days'`
  );
  const mail = await db.query(
    `DELETE FROM mail_outbox
     WHERE sent_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
        OR failed_at < CURRENT_TIMESTAMP - INTERVAL '90 days'`
  );
  return {
    refreshTokensDeleted: refresh.rowCount,
    accountTokensDeleted: account.rowCount,
    mailJobsDeleted: mail.rowCount,
  };
}
