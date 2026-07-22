// src/modules/driver/driver.routes.js
const express = require('express');
const router = express.Router();
const { verifyRole } = require('../auth/auth.middleware');
const driverController = require('./driver.controller');

// verifyToken est appliqué au montage ; on impose le rôle CHAUFFEUR ici.
router.use(verifyRole('CHAUFFEUR'));

router.get('/agenda', driverController.getAgenda);
router.patch('/services/:id/complete', driverController.completeService);

module.exports = router;
