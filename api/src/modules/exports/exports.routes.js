// src/modules/exports/exports.routes.js
const express = require('express');
const router = express.Router();
const exportsController = require('./exports.controller');
const { verifyToken } = require('../auth/auth.middleware');

// Les téléchargements sont souvent déclenchés via window.open / lien direct,
// qui ne peut pas envoyer d'en-tête Authorization. On accepte donc un token
// passé en query string (?token=...) comme repli sur les routes GET.
const allowQueryToken = (req, res, next) => {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
};

router.get('/excel', allowQueryToken, verifyToken, exportsController.excelGet);
router.post('/excel', verifyToken, exportsController.excelPost);
router.get('/csv', allowQueryToken, verifyToken, exportsController.csvGet);

module.exports = router;
