// src/modules/services/services.controller.js
const servicesService = require('./services.service');

function normalizeBody(body) {
  return {
    personnelId: body.personnelId ?? body.personnel_id,
    clientId: body.clientId ?? body.client_id,
    title: body.title,
    pickupLocation: body.pickupLocation ?? body.pickup_location,
    dropoffLocation: body.dropoffLocation ?? body.dropoff_location,
    stops: body.stops,
    startTime: body.startTime ?? body.start_time,
    endTime: body.endTime ?? body.end_time,
    notes: body.notes,
    price: body.price,
    status: body.status,
  };
}

class ServicesController {
  async getAll(req, res, next) {
    try {
      const { personnel_id, personnelId, client_id, clientId, start_date, startDate, end_date, endDate, status } = req.query;
      const data = await servicesService.findAll({
        personnelId: personnelId ?? personnel_id,
        clientId: clientId ?? client_id,
        startDate: startDate ?? start_date,
        endDate: endDate ?? end_date,
        status,
      });
      res.json({ success: true, data, total: data.length });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await servicesService.findById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await servicesService.create(normalizeBody(req.body), req.user?.id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const body = normalizeBody(req.body);
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
      const data = await servicesService.update(req.params.id, body, req.user?.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const data = await servicesService.cancel(req.params.id, req.user?.id);
      res.json({ success: true, message: 'Service annulé', data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ServicesController();
