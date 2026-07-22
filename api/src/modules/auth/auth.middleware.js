// src/modules/auth/auth.middleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const { AppError } = require('../../shared/errors/AppError');
const env = require('../../config/env');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new AppError('Token manquant', 401, 'NO_TOKEN');

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwt.secret);
    } catch {
      throw new AppError('Token invalide ou expiré', 401, 'INVALID_TOKEN');
    }

    const user = await prisma.personnel.findUnique({
      where: { id: decoded.userId },
      select: { id: true, codeId: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('Utilisateur non trouvé ou inactif', 401, 'USER_INACTIVE');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const verifyRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('Accès non autorisé', 403, 'FORBIDDEN'));
  }
  next();
};

module.exports = { verifyToken, verifyRole };
