export function createEventController(eventService) {
  return {
    async list(req, res) {
      res.json(await eventService.list(req.user.id, req.query));
    },

    async create(req, res) {
      res.status(201).json(await eventService.create(req.user.id, req.body));
    },

    async update(req, res) {
      res.json(await eventService.update(req.user.id, req.params.id, req.body));
    },

    async remove(req, res) {
      res.json(await eventService.remove(req.user.id, req.params.id));
    },
  };
}
