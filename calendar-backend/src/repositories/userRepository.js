export function createUserRepository(db) {
  return {
    async findByUsername(username) {
      const result = await db.query(
        'SELECT id, username, password FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0];
    },

    async create(username, hashedPassword) {
      const result = await db.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
        [username, hashedPassword]
      );
      return result.rows[0];
    },
  };
}
