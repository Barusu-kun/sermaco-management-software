// src/modules/stats/stats.routes.js
const express = require('express');
const router = express.Router();
const statsController = require('./stats.controller');

router.get('/dashboard', statsController.dashboard);
router.get('/by-driver', statsController.byDriver);

module.exports = router;
