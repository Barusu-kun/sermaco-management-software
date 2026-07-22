// src/modules/clients/clients.controller.js
const clientsService = require('./clients.service');

function normalizeBody(body) {
  return {
    name: body.name,
    billingAddress: body.billingAddress ?? body.billing_address,
    contactEmail: body.contactEmail ?? body.contact_email,
    contactPhone: body.contactPhone ?? body.contact_phone,
    colorCode: body.colorCode ?? body.color_code,
    isActive: body.isActive ?? body.is_active,
  };
}

class ClientsController {
  async getAll(req, res, next) {
    try {
      const { is_active, isActive } = req.query;
      const data = await clientsService.findAll({ isActive: isActive ?? is_active });
      res.json({ success: true, data, total: data.length });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await clientsService.findById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await clientsService.create(normalizeBody(req.body));
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const body = normalizeBody(req.body);
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
      const data = await clientsService.update(req.params.id, body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await clientsService.remove(req.params.id);
      res.json({ success: true, message: 'Client archivé', data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ClientsController();
