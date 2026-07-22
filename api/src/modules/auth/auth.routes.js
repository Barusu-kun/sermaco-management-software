// src/modules/auth/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('./auth.controller');
const { verifyToken } = require('./auth.middleware');
const { validate } = require('../../shared/middleware/validate');
const { authLimiter } = require('../../shared/middleware/rateLimiter');

router.post(
  '/login',
  authLimiter,
  [
    body('code_id').optional(),
    body('codeId').optional(),
    body('password').notEmpty().withMessage('Le mot de passe est requis'),
    validate,
  ],
  authController.login
);

router.post(
  '/driver-login',
  authLimiter,
  [
    body('code_id').optional(),
    body('codeId').optional(),
    validate,
  ],
  authController.driverLogin
);

router.get('/me', verifyToken, authController.me);

module.exports = router;
