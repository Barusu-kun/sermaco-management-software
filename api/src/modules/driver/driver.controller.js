// src/modules/driver/driver.controller.js
const driverService = require('./driver.service');

class DriverController {
  async getAgenda(req, res, next) {
    try {
      const data = await driverService.getAgenda(req.user.id, req.query.date);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async completeService(req, res, next) {
    try {
      const data = await driverService.completeService(
        req.user.id,
        req.params.id,
        req.body.completed
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DriverController();
