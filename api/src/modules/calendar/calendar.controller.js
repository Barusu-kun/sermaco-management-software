// src/modules/calendar/calendar.controller.js
const calendarService = require('./calendar.service');

class CalendarController {
  async getEvents(req, res, next) {
    try {
      const { start, end, personnel_id, personnelId } = req.query;
      const data = await calendarService.getEvents({
        start,
        end,
        personnelId: personnelId ?? personnel_id,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CalendarController();
