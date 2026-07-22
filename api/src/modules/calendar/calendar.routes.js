// src/modules/calendar/calendar.routes.js
const express = require('express');
const router = express.Router();
const calendarController = require('./calendar.controller');

router.get('/services', calendarController.getEvents);

module.exports = router;
