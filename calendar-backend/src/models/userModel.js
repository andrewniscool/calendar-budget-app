// models/userModel.js
import { db } from '../index.js';

export async function findUserByUsername(username) {
  const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}

export async function createUser(username, hashedPassword) {
  const result = await db.query(
    'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
    [username, hashedPassword]
  );
  return result.rows[0];
}
