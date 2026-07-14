import {
  REFRESH_COOKIE,
  authCookies,
  clearedAuthCookies,
  createCsrfToken,
  csrfCookie,
  parseCookies,
} from '../security.js';

export function createUserController(authService, config) {
  function setSessionCookies(res, session) {
    const csrf = createCsrfToken(config.CSRF_SECRET);
    res.setHeader('Set-Cookie', [
      ...authCookies(config, session.accessToken, session.refreshToken),
      csrfCookie(config, csrf),
    ]);
    res.setHeader('Cache-Control', 'no-store');
  }

  return {
    csrf(_req, res) {
      const token = createCsrfToken(config.CSRF_SECRET);
      res.setHeader('Set-Cookie', csrfCookie(config, token));
      res.setHeader('Cache-Control', 'no-store');
      res.json({ csrfToken: token });
    },

    async register(req, res) {
      res.status(202).json(await authService.register(req.body));
    },

    async verifyEmail(req, res) {
      res.json(await authService.verifyEmail(req.body));
    },

    async resendVerification(req, res) {
      res.status(202).json(await authService.resendVerification(req.body));
    },

    async login(req, res) {
      const session = await authService.login(req.body);
      setSessionCookies(res, session);
      res.json({ user: session.user });
    },

    async refresh(req, res) {
      const refreshToken = parseCookies(req.get('cookie'))[REFRESH_COOKIE];
      const session = await authService.refresh(refreshToken);
      setSessionCookies(res, session);
      res.json({ user: session.user });
    },

    async logout(req, res) {
      const refreshToken = parseCookies(req.get('cookie'))[REFRESH_COOKIE];
      const result = await authService.logout(refreshToken);
      res.setHeader('Set-Cookie', clearedAuthCookies(config));
      res.json(result);
    },

    session(req, res) {
      res.json({ user: req.user });
    },

    async forgotPassword(req, res) {
      res.status(202).json(await authService.forgotPassword(req.body));
    },

    async resetPassword(req, res) {
      const result = await authService.resetPassword(req.body);
      res.setHeader('Set-Cookie', clearedAuthCookies(config));
      res.json(result);
    },
  };
}
