// src/modules/personnel/personnel.service.js
const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');
const { AppError } = require('../../shared/errors/AppError');
const { generatePersonnelCode } = require('../../shared/utils/codeGenerator');
const { writeAudit } = require('../../shared/utils/audit');

const PUBLIC_SELECT = {
  id: true,
  codeId: true,
  firstName: true,
  lastName: true,
  role: true,
  phone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

class PersonnelService {
  async create(data, performedById) {
    const { firstName, lastName, role, phone, pinCode, isActive } = data;

    let hashedPin = null;
    if (pinCode) {
      if (!/^\d{4}$/.test(pinCode)) {
        throw new AppError('Le PIN doit être composé de 4 chiffres', 400, 'INVALID_PIN');
      }
      hashedPin = await bcrypt.hash(pinCode, 10);
    }

    return prisma.$transaction(async (tx) => {
      const codeId = await generatePersonnelCode(tx, role);
      const personnel = await tx.personnel.create({
        data: {
          codeId,
          firstName,
          lastName,
          role,
          phone: phone || null,
          pinCode: hashedPin,
          isActive: isActive ?? true,
        },
        select: PUBLIC_SELECT,
      });
      await writeAudit(tx, {
        tableName: 'personnel',
        recordId: personnel.id,
        action: 'INSERT',
        newData: personnel,
        performedById,
      });
      return personnel;
    });
  }

  async findAll({ role, isActive, search }) {
    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { codeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.personnel.findMany({
      where,
      orderBy: { lastName: 'asc' },
      select: PUBLIC_SELECT,
    });
  }

  async findById(id) {
    const personnel = await prisma.personnel.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });
    if (!personnel) throw new AppError('Personnel non trouvé', 404, 'NOT_FOUND');
    return personnel;
  }

  async update(id, data, performedById) {
    const existing = await prisma.personnel.findUnique({ where: { id }, select: PUBLIC_SELECT });
    if (!existing) throw new AppError('Personnel non trouvé', 404, 'NOT_FOUND');

    const { pinCode, role, codeId, ...updateData } = data;
    // On ignore role/codeId en modification pour garder la cohérence des identifiants.

    if (pinCode !== undefined && pinCode !== null && pinCode !== '') {
      if (!/^\d{4}$/.test(pinCode)) {
        throw new AppError('Le PIN doit être composé de 4 chiffres', 400, 'INVALID_PIN');
      }
      updateData.pinCode = await bcrypt.hash(pinCode, 10);
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.personnel.update({
        where: { id },
        data: updateData,
        select: PUBLIC_SELECT,
      });
      await writeAudit(tx, {
        tableName: 'personnel',
        recordId: id,
        action: 'UPDATE',
        oldData: existing,
        newData: updated,
        performedById,
      });
      return updated;
    });
  }

  async remove(id, performedById) {
    const existing = await prisma.personnel.findUnique({ where: { id }, select: PUBLIC_SELECT });
    if (!existing) throw new AppError('Personnel non trouvé', 404, 'NOT_FOUND');

    // Soft delete
    return prisma.$transaction(async (tx) => {
      const updated = await tx.personnel.update({
        where: { id },
        data: { isActive: false },
        select: PUBLIC_SELECT,
      });
      await writeAudit(tx, {
        tableName: 'personnel',
        recordId: id,
        action: 'UPDATE',
        oldData: existing,
        newData: updated,
        performedById,
      });
      return updated;
    });
  }
}

module.exports = new PersonnelService();
