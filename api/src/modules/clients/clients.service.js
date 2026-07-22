// src/modules/clients/clients.service.js
const prisma = require('../../config/database');
const { AppError } = require('../../shared/errors/AppError');

class ClientsService {
  async findAll({ isActive }) {
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    return prisma.client.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findById(id) {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) throw new AppError('Client non trouvé', 404, 'NOT_FOUND');
    return client;
  }

  async create(data) {
    return prisma.client.create({
      data: {
        name: data.name,
        billingAddress: data.billingAddress || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        colorCode: data.colorCode || '#3B82F6',
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id, data) {
    await this.findById(id);
    return prisma.client.update({ where: { id }, data });
  }

  async remove(id) {
    await this.findById(id);
    // Suppression logique pour préserver l'historique des services
    return prisma.client.update({ where: { id }, data: { isActive: false } });
  }
}

module.exports = new ClientsService();
