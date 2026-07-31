export function createFinancialSettingsController(financialSettingsService) {
  return {
    async get(req, res) {
      res.json(await financialSettingsService.get(req.user.id));
    },

    async update(req, res) {
      res.json(await financialSettingsService.update(req.user.id, req.body));
    },
  };
}
