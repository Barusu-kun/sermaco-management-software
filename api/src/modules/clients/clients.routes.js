// src/modules/clients/clients.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const clientsController = require('./clients.controller');
const { verifyRole } = require('../auth/auth.middleware');
const { validate } = require('../../shared/middleware/validate');

router.get('/', clientsController.getAll);
router.get('/:id', clientsController.getById);

router.post(
  '/',
  verifyRole('DISPATCH'),
  [body('name').trim().notEmpty().withMessage('Le nom du client est requis'), validate],
  clientsController.create
);

router.put('/:id', verifyRole('DISPATCH'), clientsController.update);
router.delete('/:id', verifyRole('DISPATCH'), clientsController.remove);

module.exports = router;
