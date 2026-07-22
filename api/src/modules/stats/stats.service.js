// src/modules/stats/stats.service.js
const prisma = require('../../config/database');

function periodWhere(startDate, endDate) {
  const where = {};
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(`${endDate}T23:59:59`);
  }
  return where;
}

const emptyStatus = () => ({ PLANIFIE: 0, EN_COURS: 0, TERMINE: 0, ANNULE: 0 });

class StatsService {
  async dashboard({ startDate, endDate }) {
    const where = periodWhere(startDate, endDate);
    const services = await prisma.service.findMany({ where, select: { status: true } });

    const byStatus = emptyStatus();
    for (const s of services) byStatus[s.status] = (byStatus[s.status] || 0) + 1;

    const activeDrivers = await prisma.personnel.count({
      where: { role: 'CHAUFFEUR', isActive: true },
    });

    return {
      total_services: services.length,
      services_by_status: byStatus,
      services_done: byStatus.TERMINE,
      services_cancelled: byStatus.ANNULE,
      services_in_progress: byStatus.EN_COURS,
      services_planned: byStatus.PLANIFIE,
      active_drivers: activeDrivers,
    };
  }

  async byDriver({ startDate, endDate }) {
    const where = periodWhere(startDate, endDate);

    const drivers = await prisma.personnel.findMany({
      where: { role: 'CHAUFFEUR' },
      select: { id: true, codeId: true, firstName: true, lastName: true, isActive: true },
      orderBy: { lastName: 'asc' },
    });

    const services = await prisma.service.findMany({
      where,
      select: { personnelId: true, status: true },
    });

    return drivers.map((d) => {
      const own = services.filter((s) => s.personnelId === d.id);
      const byStatus = emptyStatus();
      for (const s of own) byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      return {
        chauffeur_id: d.id,
        chauffeur_code: d.codeId,
        chauffeur_name: `${d.firstName} ${d.lastName}`,
        is_active: d.isActive,
        total: own.length,
        planifie: byStatus.PLANIFIE,
        en_cours: byStatus.EN_COURS,
        termine: byStatus.TERMINE,
        annule: byStatus.ANNULE,
      };
    });
  }
}

module.exports = new StatsService();
