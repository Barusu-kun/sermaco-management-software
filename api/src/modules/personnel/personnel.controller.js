// src/modules/personnel/personnel.controller.js
const personnelService = require('./personnel.service');

// Accepte indifféremment camelCase et snake_case en entrée.
function normalizeBody(body) {
  return {
    firstName: body.firstName ?? body.first_name,
    lastName: body.lastName ?? body.last_name,
    role: body.role,
    phone: body.phone,
    pinCode: body.pinCode ?? body.pin_code,
    isActive: body.isActive ?? body.is_active,
  };
}

class PersonnelController {
  async getAll(req, res, next) {
    try {
      const { role, is_active, isActive, search } = req.query;
      const data = await personnelService.findAll({
        role,
        isActive: isActive ?? is_active,
        search,
      });
      res.json({ success: true, data, total: data.length });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await personnelService.findById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await personnelService.create(normalizeBody(req.body), req.user?.id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const body = normalizeBody(req.body);
      // Ne pas écraser avec des undefined
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
      const data = await personnelService.update(req.params.id, body, req.user?.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await personnelService.remove(req.params.id, req.user?.id);
      res.json({ success: true, message: 'Personnel archivé', data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PersonnelController();
