// src/modules/personnel/personnel.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const personnelController = require('./personnel.controller');
const { verifyRole } = require('../auth/auth.middleware');
const { validate } = require('../../shared/middleware/validate');

// verifyToken est appliqué au niveau du montage (app.js)
router.get('/', personnelController.getAll);
router.get('/:id', personnelController.getById);

router.post(
  '/',
  verifyRole('DISPATCH'),
  [
    body('first_name').optional(),
    body('firstName').optional(),
    body('last_name').optional(),
    body('lastName').optional(),
    body('role').isIn(['DISPATCH', 'CHAUFFEUR']).withMessage('Rôle invalide'),
    body('pin_code').optional({ values: 'falsy' }).isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN de 4 chiffres'),
    body('pinCode').optional({ values: 'falsy' }).isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN de 4 chiffres'),
    validate,
  ],
  personnelController.create
);

router.put('/:id', verifyRole('DISPATCH'), personnelController.update);
router.delete('/:id', verifyRole('DISPATCH'), personnelController.remove);

module.exports = router;
