import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { conflict, unauthorized } from '../errors.js';
import { hashToken, randomToken } from '../security.js';

const INVALID_CREDENTIALS = 'Invalid credentials';

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: Boolean(user.email_verified_at),
  };
}

function expiresFromNow(amount, unitMs) {
  return new Date(Date.now() + amount * unitMs);
}

export function createAuthService(userRepository, mailService, config) {
  const dummyHash = bcrypt.hash('not-a-real-password', 12);

  function signAccessToken(user) {
    return jwt.sign(
      {
        sub: String(user.id),
        username: user.username,
        email: user.email,
        ver: user.auth_version,
      },
      config.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: `${config.ACCESS_TOKEN_TTL_MINUTES}m`,
        issuer: 'calendar-budget-api',
        audience: 'calendar-budget-web',
      }
    );
  }

  async function issueAccountToken(user, type) {
    const token = randomToken();
    const lifetime = type === 'email_verification'
      ? config.VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000
      : config.RESET_TOKEN_TTL_MINUTES * 60 * 1000;
    await userRepository.createAccountToken(
      user.id,
      type,
      hashToken(token),
      new Date(Date.now() + lifetime)
    );
    return token;
  }

  async function issueSession(user) {
    const refreshToken = randomToken();
    await userRepository.createRefreshToken({
      userId: user.id,
      familyId: crypto.randomUUID(),
      tokenHash: hashToken(refreshToken),
      expiresAt: expiresFromNow(config.REFRESH_TOKEN_TTL_DAYS, 24 * 60 * 60 * 1000),
    });
    return {
      accessToken: signAccessToken(user),
      refreshToken,
      user: publicUser(user),
    };
  }

  return {
    async register({ username, email, password }) {
      const existingUsername = await userRepository.findByUsername(username);
      const existingEmail = await userRepository.findByEmail(email);
      if (existingUsername) throw conflict('Username already exists');
      if (existingEmail) throw conflict('Email already exists');

      const hashedPassword = await bcrypt.hash(password, 12);
      let user;
      try {
        user = await userRepository.create(username, email, hashedPassword);
      } catch (error) {
        if (error.code === '23505') throw conflict('Username or email already exists');
        throw error;
      }
      const token = await issueAccountToken(user, 'email_verification');
      await mailService.sendVerification(user.email, token);
      return { message: 'Registration accepted. Check your email to verify your account.' };
    },

    async verifyEmail({ token }) {
      const user = await userRepository.consumeVerificationToken(hashToken(token));
      if (!user) throw unauthorized('Invalid or expired verification token');
      return { message: 'Email verified. You can now log in.' };
    },

    async resendVerification({ email }) {
      const user = await userRepository.findByEmail(email);
      if (user && !user.email_verified_at) {
        const token = await issueAccountToken(user, 'email_verification');
        await mailService.sendVerification(user.email, token);
      }
      return { message: 'If the account is eligible, a verification email has been sent.' };
    },

    async login({ email, password }) {
      const user = await userRepository.findByEmail(email);
      const valid = await bcrypt.compare(password, user?.password ?? await dummyHash);
      const locked = user?.locked_until && new Date(user.locked_until) > new Date();

      if (!user || !valid || locked || !user.email_verified_at) {
        if (user && !valid && !locked) {
          await userRepository.recordLoginFailure(
            user.id,
            config.LOCKOUT_ATTEMPTS,
            config.LOCKOUT_MINUTES
          );
        }
        throw unauthorized(INVALID_CREDENTIALS);
      }

      await userRepository.clearLoginFailures(user.id);
      return issueSession(user);
    },

    async refresh(refreshToken) {
      if (!refreshToken) throw unauthorized();
      const replacement = randomToken();
      const result = await userRepository.rotateRefreshToken(hashToken(refreshToken), {
        tokenHash: hashToken(replacement),
      });
      if (result.status !== 'rotated') throw unauthorized('Invalid or expired session');
      return {
        accessToken: signAccessToken(result.user),
        refreshToken: replacement,
        user: publicUser(result.user),
      };
    },

    async logout(refreshToken) {
      if (refreshToken) await userRepository.revokeRefreshFamily(hashToken(refreshToken));
      return { message: 'Logged out' };
    },

    async forgotPassword({ email }) {
      const user = await userRepository.findByEmail(email);
      if (user?.email_verified_at) {
        const token = await issueAccountToken(user, 'password_reset');
        await mailService.sendPasswordReset(user.email, token);
      }
      return { message: 'If the account exists, a password reset email has been sent.' };
    },

    async resetPassword({ token, password }) {
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await userRepository.consumeResetToken(hashToken(token), hashedPassword);
      if (!user) throw unauthorized('Invalid or expired password reset token');
      return { message: 'Password reset. Please log in again.' };
    },

    async enrollLegacyEmail({ username, password, email }) {
      const user = await userRepository.findByUsername(username);
      const valid = await bcrypt.compare(password, user?.password ?? await dummyHash);
      if (!user || !valid || user.email) throw unauthorized(INVALID_CREDENTIALS);

      let updated;
      try {
        updated = await userRepository.attachLegacyEmail(user.id, email);
      } catch (error) {
        if (error.code === '23505') throw conflict('Email already exists');
        throw error;
      }
      if (!updated) throw unauthorized(INVALID_CREDENTIALS);
      const token = await issueAccountToken(updated, 'email_verification');
      await mailService.sendVerification(updated.email, token);
      return { message: 'Email added. Check your email to verify your account.' };
    },
  };
}
