// src/modules/driver/driver.service.js
const prisma = require('../../config/database');
const { AppError } = require('../../shared/errors/AppError');

function dayBounds(dateStr) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function gpsUrl(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || '')}`;
}

class DriverService {
  async getAgenda(driverId, date) {
    const { start, end } = dayBounds(date);

    const services = await prisma.service.findMany({
      where: {
        personnelId: driverId,
        status: { not: 'ANNULE' },
        startTime: { gte: start, lte: end },
      },
      include: { client: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
    });

    return services.map((s) => ({
      id: s.id,
      service_code: s.serviceCode,
      title: s.title || s.pickupLocation || s.dropoffLocation || 'Service',
      status: s.status,
      start_time: s.startTime.toISOString(),
      end_time: s.endTime ? s.endTime.toISOString() : null,
      pickup_location: s.pickupLocation,
      dropoff_location: s.dropoffLocation,
      stops: s.stops || [],
      notes: s.notes,
      client_name: s.client?.name || 'Particulier',
      completed_by_driver: s.completedByDriver,
      gps_url: gpsUrl(s.dropoffLocation || s.pickupLocation || ''),
    }));
  }

  async completeService(driverId, serviceId, completed) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new AppError('Service non trouvé', 404, 'NOT_FOUND');
    if (service.personnelId !== driverId) {
      throw new AppError("Ce service n'est pas attribué à ce chauffeur", 403, 'FORBIDDEN');
    }

    return prisma.service.update({
      where: { id: serviceId },
      data: { completedByDriver: completed ?? true },
      select: { id: true, completedByDriver: true },
    });
  }
}

module.exports = new DriverService();
