// src/modules/services/services.service.js
const prisma = require('../../config/database');
const { AppError } = require('../../shared/errors/AppError');
const { generateServiceCode } = require('../../shared/utils/codeGenerator');
const { writeAudit } = require('../../shared/utils/audit');

const INCLUDE = {
  chauffeur: { select: { id: true, codeId: true, firstName: true, lastName: true } },
  client: { select: { id: true, name: true, colorCode: true } },
};

const HOUR_MS = 3600 * 1000;
const DEFAULT_DURATION_MS = 90 * 60 * 1000; // 1h30 par défaut

function effectiveEnd(start, end) {
  return end ? new Date(end) : new Date(new Date(start).getTime() + DEFAULT_DURATION_MS);
}

function normalizeStops(stops) {
  if (!Array.isArray(stops)) return [];
  return stops.map((s) => String(s || '').trim()).filter(Boolean);
}

// Au moins une information utile doit être renseignée (titre, adresse, arrêt ou note).
function hasAtLeastOneInfo(d) {
  return !!(
    (d.title && d.title.trim()) ||
    (d.pickupLocation && d.pickupLocation.trim()) ||
    (d.dropoffLocation && d.dropoffLocation.trim()) ||
    (d.notes && d.notes.trim()) ||
    normalizeStops(d.stops).length > 0
  );
}

class ServicesService {
  /**
   * Vérifie qu'aucun autre service (non annulé) du même chauffeur ne chevauche.
   */
  async assertNoOverlap(tx, { personnelId, startTime, endTime, excludeId }) {
    const newStart = new Date(startTime);
    const newEnd = effectiveEnd(startTime, endTime);

    const candidates = await tx.service.findMany({
      where: {
        personnelId,
        status: { not: 'ANNULE' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, startTime: true, endTime: true, serviceCode: true },
    });

    for (const c of candidates) {
      const cStart = new Date(c.startTime);
      const cEnd = effectiveEnd(c.startTime, c.endTime);
      // Chevauchement strict : [newStart, newEnd) ∩ [cStart, cEnd)
      if (newStart < cEnd && cStart < newEnd) {
        throw new AppError(
          `Chevauchement d'horaire détecté avec le service ${c.serviceCode}`,
          409,
          'SCHEDULE_OVERLAP'
        );
      }
    }
  }

  async findAll({ personnelId, clientId, startDate, endDate, status }) {
    const where = {};
    if (personnelId) where.personnelId = personnelId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(`${endDate}T23:59:59`);
    }

    return prisma.service.findMany({
      where,
      include: INCLUDE,
      orderBy: { startTime: 'asc' },
    });
  }

  async findById(id) {
    const service = await prisma.service.findUnique({ where: { id }, include: INCLUDE });
    if (!service) throw new AppError('Service non trouvé', 404, 'NOT_FOUND');
    return service;
  }

  async create(data, performedById) {
    const { personnelId, clientId, title, pickupLocation, dropoffLocation, startTime, endTime, notes, price } = data;

    // Seuls le chauffeur, l'heure de début et une information sont requis.
    if (!personnelId) throw new AppError('Le chauffeur est requis', 400, 'MISSING_PERSONNEL');
    if (!startTime) throw new AppError("L'heure de début est requise", 400, 'MISSING_START');
    if (!hasAtLeastOneInfo(data)) {
      throw new AppError('Renseignez au moins un titre, une adresse ou une note', 400, 'MISSING_INFO');
    }

    return prisma.$transaction(async (tx) => {
      const chauffeur = await tx.personnel.findUnique({ where: { id: personnelId } });
      if (!chauffeur) throw new AppError('Chauffeur non trouvé', 404, 'DRIVER_NOT_FOUND');

      // Fin par défaut = début + 1h30 si non fournie.
      const resolvedEnd = endTime ? new Date(endTime) : new Date(new Date(startTime).getTime() + DEFAULT_DURATION_MS);

      await this.assertNoOverlap(tx, { personnelId, startTime, endTime: resolvedEnd });

      const serviceCode = await generateServiceCode(tx, startTime);
      const service = await tx.service.create({
        data: {
          serviceCode,
          personnelId,
          clientId: clientId || null,
          title: title?.trim() || null,
          pickupLocation: pickupLocation?.trim() || null,
          dropoffLocation: dropoffLocation?.trim() || null,
          stops: normalizeStops(data.stops),
          startTime: new Date(startTime),
          endTime: resolvedEnd,
          notes: notes?.trim() || null,
          price: price !== undefined && price !== '' && price !== null ? Number(price) : null,
        },
        include: INCLUDE,
      });

      await writeAudit(tx, {
        tableName: 'services',
        recordId: service.id,
        action: 'INSERT',
        newData: { ...service, price: service.price?.toString() },
        performedById,
      });

      return service;
    });
  }

  async update(id, data, performedById) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.service.findUnique({ where: { id }, include: INCLUDE });
      if (!existing) throw new AppError('Service non trouvé', 404, 'NOT_FOUND');

      const updateData = {};
      if (data.personnelId !== undefined) updateData.personnelId = data.personnelId;
      if (data.clientId !== undefined) updateData.clientId = data.clientId || null;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.pickupLocation !== undefined) updateData.pickupLocation = data.pickupLocation?.trim() || null;
      if (data.dropoffLocation !== undefined) updateData.dropoffLocation = data.dropoffLocation?.trim() || null;
      if (data.stops !== undefined) updateData.stops = normalizeStops(data.stops);
      if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
      if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.price !== undefined) {
        updateData.price = data.price === '' || data.price === null ? null : Number(data.price);
      }

      const nextPersonnel = updateData.personnelId ?? existing.personnelId;
      const nextStart = updateData.startTime ?? existing.startTime;
      const nextEnd = updateData.endTime !== undefined ? updateData.endTime : existing.endTime;
      const nextStatus = updateData.status ?? existing.status;

      if (nextStatus !== 'ANNULE') {
        await this.assertNoOverlap(tx, {
          personnelId: nextPersonnel,
          startTime: nextStart,
          endTime: nextEnd,
          excludeId: id,
        });
      }

      const updated = await tx.service.update({ where: { id }, data: updateData, include: INCLUDE });

      await writeAudit(tx, {
        tableName: 'services',
        recordId: id,
        action: 'UPDATE',
        oldData: { ...existing, price: existing.price?.toString() },
        newData: { ...updated, price: updated.price?.toString() },
        performedById,
      });

      return updated;
    });
  }

  async cancel(id, performedById) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.service.findUnique({ where: { id } });
      if (!existing) throw new AppError('Service non trouvé', 404, 'NOT_FOUND');

      const updated = await tx.service.update({
        where: { id },
        data: { status: 'ANNULE' },
        include: INCLUDE,
      });

      await writeAudit(tx, {
        tableName: 'services',
        recordId: id,
        action: 'UPDATE',
        oldData: { status: existing.status },
        newData: { status: 'ANNULE' },
        performedById,
      });

      return updated;
    });
  }
}

module.exports = new ServicesService();
