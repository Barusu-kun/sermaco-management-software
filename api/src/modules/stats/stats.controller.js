// src/modules/stats/stats.controller.js
const statsService = require('./stats.service');

function period(req) {
  const { start_date, startDate, end_date, endDate } = req.query;
  return { startDate: startDate ?? start_date, endDate: endDate ?? end_date };
}

class StatsController {
  async dashboard(req, res, next) {
    try {
      const data = await statsService.dashboard(period(req));
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async byDriver(req, res, next) {
    try {
      const data = await statsService.byDriver(period(req));
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StatsController();
