// src/modules/services/services.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const servicesController = require('./services.controller');
const { verifyRole } = require('../auth/auth.middleware');
const { validate } = require('../../shared/middleware/validate');

router.get('/', servicesController.getAll);
router.get('/:id', servicesController.getById);

router.post(
  '/',
  verifyRole('DISPATCH'),
  [
    // Seuls le chauffeur et l'heure de début sont obligatoires côté route.
    // La règle « au moins une information » est vérifiée dans le service.
    body('personnel_id').optional(),
    body('personnelId').optional(),
    body('start_time').optional(),
    body('startTime').optional(),
    validate,
  ],
  servicesController.create
);

router.put('/:id', verifyRole('DISPATCH'), servicesController.update);
router.delete('/:id', verifyRole('DISPATCH'), servicesController.cancel);

module.exports = router;
