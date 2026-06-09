import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { conflict, unauthorized } from '../errors.js';

export function createAuthService(userRepository, config) {
  return {
    async register({ username, password }) {
      const existing = await userRepository.findByUsername(username);
      if (existing) throw conflict('Username already exists');

      const hashedPassword = await bcrypt.hash(password, 12);
      return userRepository.create(username, hashedPassword);
    },

    async login({ username, password }) {
      const user = await userRepository.findByUsername(username);
      const valid = user ? await bcrypt.compare(password, user.password) : false;
      if (!valid) throw unauthorized('Invalid credentials');

      const token = jwt.sign(
        { id: user.id, username: user.username },
        config.JWT_SECRET,
        {
          algorithm: 'HS256',
          expiresIn: '1h',
          issuer: 'calendar-budget-api',
          audience: 'calendar-budget-web',
        }
      );
      return { token, username: user.username };
    },
  };
}
