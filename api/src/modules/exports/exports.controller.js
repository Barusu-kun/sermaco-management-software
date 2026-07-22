// src/modules/exports/exports.controller.js
const exportsService = require('./exports.service');

function toArray(v) {
  if (!v) return undefined;
  return Array.isArray(v) ? v : String(v).split(',').filter(Boolean);
}

class ExportsController {
  async excelGet(req, res, next) {
    try {
      const { start_date, startDate, end_date, endDate, personnel_id, client_id } = req.query;
      const buffer = await exportsService.generateExcel({
        startDate: startDate ?? start_date,
        endDate: endDate ?? end_date,
        personnelIds: toArray(personnel_id),
        clientIds: toArray(client_id),
      });
      res
        .status(200)
        .setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .setHeader('Content-Disposition', `attachment; filename="export_services_${Date.now()}.xlsx"`)
        .send(buffer);
    } catch (err) {
      next(err);
    }
  }

  async excelPost(req, res, next) {
    try {
      const b = req.body;
      const buffer = await exportsService.generateExcel({
        startDate: b.startDate ?? b.start_date,
        endDate: b.endDate ?? b.end_date,
        personnelIds: b.personnelIds ?? b.personnel_ids,
        clientIds: b.clientIds ?? b.client_ids,
        columns: b.columns,
      });
      res
        .status(200)
        .setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .setHeader('Content-Disposition', `attachment; filename="export_services_${Date.now()}.xlsx"`)
        .send(buffer);
    } catch (err) {
      next(err);
    }
  }

  async csvGet(req, res, next) {
    try {
      const { start_date, startDate, end_date, endDate } = req.query;
      const csv = await exportsService.generateCSV({
        startDate: startDate ?? start_date,
        endDate: endDate ?? end_date,
      });
      res
        .status(200)
        .setHeader('Content-Type', 'text/csv; charset=utf-8')
        .setHeader('Content-Disposition', `attachment; filename="export_services_${Date.now()}.csv"`)
        .send('﻿' + csv); // BOM pour Excel
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExportsController();
