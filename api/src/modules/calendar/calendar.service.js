// src/modules/calendar/calendar.service.js
const prisma = require('../../config/database');

const DEFAULT_DURATION_MS = 90 * 60 * 1000; // 1h30

class CalendarService {
  async getEvents({ start, end, personnelId }) {
    const where = { status: { not: 'ANNULE' } };

    if (start || end) {
      where.startTime = {};
      if (start) where.startTime.gte = new Date(start);
      if (end) where.startTime.lte = new Date(end);
    }
    if (personnelId) where.personnelId = personnelId;

    const services = await prisma.service.findMany({
      where,
      include: {
        chauffeur: { select: { id: true, codeId: true, firstName: true, lastName: true } },
        client: { select: { id: true, name: true, colorCode: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Format FullCalendar
    return services.map((s) => ({
      id: s.id,
      title: `${s.serviceCode} - ${s.title || s.pickupLocation || s.dropoffLocation || 'Service'}`,
      start: s.startTime.toISOString(),
      end: (s.endTime || new Date(s.startTime.getTime() + DEFAULT_DURATION_MS)).toISOString(),
      color: s.client?.colorCode || '#3B82F6',
      extendedProps: {
        serviceCode: s.serviceCode,
        title: s.title,
        chauffeurId: s.chauffeur.id,
        chauffeurName: `${s.chauffeur.firstName} ${s.chauffeur.lastName}`,
        clientId: s.client?.id || null,
        clientName: s.client?.name || 'Particulier',
        pickupLocation: s.pickupLocation,
        dropoffLocation: s.dropoffLocation,
        stops: s.stops || [],
        price: s.price ? Number(s.price) : null,
        notes: s.notes,
        status: s.status,
      },
    }));
  }
}

module.exports = new CalendarService();
