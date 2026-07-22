// src/modules/exports/exports.service.js
const prisma = require('../../config/database');
const XLSX = require('xlsx');
const { stringify } = require('csv-stringify/sync');

const HOUR_MS = 3600 * 1000;

function buildWhere({ startDate, endDate, personnelIds, clientIds }) {
  const where = { status: { not: 'ANNULE' } };
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(`${endDate}T23:59:59`);
  }
  if (personnelIds?.length) where.personnelId = { in: personnelIds };
  if (clientIds?.length) where.clientId = { in: clientIds };
  return where;
}

const HEADERS = {
  service_code: 'N° Service',
  date: 'Date',
  chauffeur: 'Chauffeur',
  client: 'Client',
  pickup: 'Départ',
  dropoff: 'Destination',
  price: 'Montant (€)',
  duration: 'Durée (h)',
};

class ExportsService {
  async fetchServices(params) {
    return prisma.service.findMany({
      where: buildWhere(params),
      include: {
        chauffeur: { select: { codeId: true, firstName: true, lastName: true } },
        client: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async generateExcel(params) {
    const services = await this.fetchServices(params);
    const columns = params.columns?.length
      ? params.columns
      : ['service_code', 'date', 'chauffeur', 'client', 'pickup', 'dropoff', 'price', 'duration'];

    const rows = services.map((s) => {
      const row = {};
      if (columns.includes('service_code')) row[HEADERS.service_code] = s.serviceCode;
      if (columns.includes('date')) row[HEADERS.date] = s.startTime.toISOString().split('T')[0];
      if (columns.includes('chauffeur')) row[HEADERS.chauffeur] = `${s.chauffeur.firstName} ${s.chauffeur.lastName}`;
      if (columns.includes('client')) row[HEADERS.client] = s.client?.name || 'Particulier';
      if (columns.includes('pickup')) row[HEADERS.pickup] = s.pickupLocation;
      if (columns.includes('dropoff')) row[HEADERS.dropoff] = s.dropoffLocation;
      if (columns.includes('price')) row[HEADERS.price] = s.price ? Number(s.price) : 0;
      if (columns.includes('duration')) {
        const end = s.endTime || new Date(s.startTime.getTime() + HOUR_MS);
        row[HEADERS.duration] = Number(((end - s.startTime) / HOUR_MS).toFixed(2));
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Services');

    const summary = [
      {
        Période: `${params.startDate || '—'} au ${params.endDate || '—'}`,
        'Total Services': services.length,
        'Montant Total (€)': Number(
          services.reduce((sum, s) => sum + (s.price ? Number(s.price) : 0), 0).toFixed(2)
        ),
      },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async generateCSV(params) {
    const services = await this.fetchServices(params);
    const data = services.map((s) => ({
      'N° Service': s.serviceCode,
      Date: s.startTime.toISOString(),
      Chauffeur: `${s.chauffeur.firstName} ${s.chauffeur.lastName}`,
      Client: s.client?.name || 'Particulier',
      Départ: s.pickupLocation,
      Destination: s.dropoffLocation,
      Montant: s.price ? Number(s.price) : 0,
      Statut: s.status,
    }));
    return stringify(data, { header: true, delimiter: ';' });
  }
}

module.exports = new ExportsService();
