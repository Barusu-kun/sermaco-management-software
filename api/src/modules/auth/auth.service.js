// src/modules/auth/auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { AppError } = require('../../shared/errors/AppError');
const env = require('../../config/env');

function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function toPublicUser(user) {
  // Ne jamais retourner le PIN en clair
  const { pinCode, ...safe } = user;
  return safe;
}

class AuthService {
  /**
   * Connexion opérateur (Dispatch). Le "password" est vérifié contre le
   * pin_code stocké (haché). Le schéma ne prévoit pas de colonne password.
   */
  async login(codeId, password) {
    const user = await prisma.personnel.findFirst({
      where: { codeId, role: 'DISPATCH', isActive: true },
    });
    if (!user) throw new AppError('Identifiants invalides', 401, 'INVALID_CREDENTIALS');

    if (!user.pinCode) {
      throw new AppError('Aucun mot de passe configuré pour cet opérateur', 401, 'NO_PASSWORD');
    }

    const valid = await bcrypt.compare(password, user.pinCode);
    if (!valid) throw new AppError('Identifiants invalides', 401, 'INVALID_CREDENTIALS');

    return { token: signToken(user), user: toPublicUser(user) };
  }

  /**
   * Connexion chauffeur (code + PIN optionnel).
   */
  async driverLogin(codeId, pinCode) {
    const driver = await prisma.personnel.findFirst({
      where: { codeId, role: 'CHAUFFEUR', isActive: true },
    });
    if (!driver) throw new AppError('Chauffeur non trouvé', 404, 'DRIVER_NOT_FOUND');

    if (driver.pinCode) {
      const valid = await bcrypt.compare(pinCode || '', driver.pinCode);
      if (!valid) throw new AppError('PIN incorrect', 401, 'INVALID_PIN');
    }

    return { token: signToken(driver), user: toPublicUser(driver) };
  }
}

module.exports = new AuthService();
