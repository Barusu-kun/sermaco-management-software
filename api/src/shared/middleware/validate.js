// src/shared/middleware/validate.js
const { validationResult } = require('express-validator');
const { AppError } = require('../errors/AppError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(new AppError(message, 400, 'VALIDATION_ERROR'));
  }
  next();
};

module.exports = { validate };
