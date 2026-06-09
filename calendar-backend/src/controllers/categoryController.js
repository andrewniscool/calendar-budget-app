export function createCategoryController(categoryService) {
  return {
    async list(req, res) {
      res.json(await categoryService.list(req.user.id, req.query.calendarId));
    },

    async create(req, res) {
      res.status(201).json(await categoryService.create(req.user.id, req.body));
    },

    async update(req, res) {
      res.json(await categoryService.update(req.user.id, req.params.id, req.body));
    },

    async remove(req, res) {
      res.json(await categoryService.remove(req.user.id, req.params.id));
    },

    async removeAll(req, res) {
      res.json(await categoryService.removeAll(req.user.id, req.query.calendarId));
    },
  };
}
