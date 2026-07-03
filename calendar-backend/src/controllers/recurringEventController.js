export function createRecurringEventController(recurringEventService) {
  return {
    async list(req, res) {
      res.json(await recurringEventService.list(req.user.id, req.query.calendarId));
    },

    async create(req, res) {
      res.status(201).json(await recurringEventService.create(req.user.id, req.body));
    },

    async update(req, res) {
      res.json(await recurringEventService.update(req.user.id, req.params.id, req.body));
    },

    async remove(req, res) {
      res.json(await recurringEventService.remove(req.user.id, req.params.id));
    },
  };
}
