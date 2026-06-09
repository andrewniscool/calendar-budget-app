export function createUserController(authService) {
  return {
    async register(req, res) {
      const user = await authService.register(req.body);
      res.status(201).json(user);
    },

    async login(req, res) {
      const session = await authService.login(req.body);
      res.json(session);
    },
  };
}
