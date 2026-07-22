// src/shared/errors/errorHandler.js
const { AppError } = require('./AppError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err.message);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // Prisma : contrainte d'unicité
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: "Contrainte d'unicité violée",
      field: err.meta?.target,
    });
  }

  // Prisma : enregistrement non trouvé
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Enregistrement non trouvé',
    });
  }

  // Prisma : violation de clé étrangère
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Référence invalide (clé étrangère)',
      field: err.meta?.field_name,
    });
  }

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne du serveur',
  });
};

module.exports = { errorHandler };
