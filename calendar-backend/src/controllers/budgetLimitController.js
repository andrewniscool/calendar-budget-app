export function createBudgetLimitController(budgetLimitService) {
  return {
    async list(req, res) {
      res.json(await budgetLimitService.list(req.user.id, req.query));
    },

    async upsert(req, res) {
      res.json(await budgetLimitService.upsert(req.user.id, req.body));
    },
  };
}
