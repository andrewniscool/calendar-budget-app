export function createCalendarController(calendarService) {
  return {
    async list(req, res) {
      res.json(await calendarService.list(req.user.id));
    },

    async create(req, res) {
      res.status(201).json(await calendarService.create(req.user.id, req.body));
    },

    async remove(req, res) {
      res.json(await calendarService.remove(req.user.id, req.params.id));
    },
  };
}
