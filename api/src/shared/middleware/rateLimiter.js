// src/shared/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Limiteur strict pour les endpoints d'authentification (5 tentatives / minute)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans une minute.',
  },
});

// Limiteur général de l'API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
  },
});

module.exports = { authLimiter, apiLimiter };
