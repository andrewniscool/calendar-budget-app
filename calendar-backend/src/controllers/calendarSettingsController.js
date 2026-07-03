export function createCalendarSettingsController(calendarSettingsService) {
  return {
    async get(req, res) {
      res.json(await calendarSettingsService.get(req.user.id, req.params.id));
    },

    async update(req, res) {
      res.json(await calendarSettingsService.update(req.user.id, req.params.id, req.body));
    },
  };
}
