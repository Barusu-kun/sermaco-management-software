// ============================================================
// Serveur API FACTICE (in-memory) — Planning Transport
// Reproduit les endpoints réels pour tester le frontend SANS
// base de données ni serveur Linux. Les données sont en mémoire
// et réinitialisées à chaque redémarrage.
//
//   npm install && npm start      → http://localhost:3000
// ============================================================
const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const portic = require('./portic');

const app = express();
const PORT = process.env.PORT || 3000;
const HOUR = 3600 * 1000;
const DEFAULT_DURATION = 90 * 60 * 1000; // 1h30

function normalizeStops(stops) {
  if (!Array.isArray(stops)) return [];
  return stops.map((s) => String(s || '').trim()).filter(Boolean);
}
function hasAtLeastOneInfo(d) {
  return !!(
    (d.title && String(d.title).trim()) ||
    (d.pickupLocation && String(d.pickupLocation).trim()) ||
    (d.dropoffLocation && String(d.dropoffLocation).trim()) ||
    (d.notes && String(d.notes).trim()) ||
    normalizeStops(d.stops).length > 0
  );
}

app.use(cors({ origin: true }));
app.use(express.json());

// ─────────────── Données en mémoire ───────────────
const now = new Date();
function at(dayOffset, h, m = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

let personnel = [
  { id: 'p1', codeId: 'OP-001', firstName: 'Marie', lastName: 'Dupont', role: 'DISPATCH', phone: '0612345678', pin: '1234', isActive: true },
  { id: 'p2', codeId: 'CH-001', firstName: 'Jean', lastName: 'Martin', role: 'CHAUFFEUR', phone: '0623456789', pin: '0000', isActive: true },
  { id: 'p3', codeId: 'CH-002', firstName: 'Pierre', lastName: 'Bernard', role: 'CHAUFFEUR', phone: '0634567890', pin: null, isActive: true },
  { id: 'p4', codeId: 'CH-003', firstName: 'Sophie', lastName: 'Petit', role: 'CHAUFFEUR', phone: '0645678901', pin: '1111', isActive: true },
  { id: 'p5', codeId: 'CH-004', firstName: 'Lucas', lastName: 'Moreau', role: 'CHAUFFEUR', phone: '0656789012', pin: null, isActive: false },
  { id: 'p6', codeId: 'CH-005', firstName: 'Karim', lastName: 'Benali', role: 'CHAUFFEUR', phone: '0667890123', pin: null, isActive: true },
  { id: 'p7', codeId: 'CH-006', firstName: 'Adam', lastName: 'Sermaco', role: 'CHAUFFEUR', phone: '0678901234', pin: null, isActive: true },
  { id: 'p8', codeId: 'CH-007', firstName: 'Marta', lastName: 'Ferrer', role: 'CHAUFFEUR', phone: '0689012345', pin: null, isActive: true },
  { id: 'p9', codeId: 'CH-008', firstName: 'Diego', lastName: 'Ramos', role: 'CHAUFFEUR', phone: '0690123456', pin: null, isActive: true },
];

let clients = [
  { id: 'c1', name: 'Transport Express SA', billingAddress: '12 Rue de la Paix, 75002 Paris', contactEmail: 'contact@transport-express.fr', contactPhone: '0145678901', colorCode: '#EF4444', isActive: true },
  { id: 'c2', name: 'Voyages Deluxe', billingAddress: '45 Av. des Champs-Élysées, 75008 Paris', contactEmail: 'reservations@voyages-deluxe.fr', contactPhone: '0145678902', colorCode: '#3B82F6', isActive: true },
  { id: 'c3', name: 'Entreprise Dupont & Fils', billingAddress: '8 Bd Haussmann, 75009 Paris', contactEmail: 'secretariat@dupont-fils.fr', contactPhone: '0145678903', colorCode: '#10B981', isActive: true },
  { id: 'c4', name: 'Hôtel Grand Luxe', billingAddress: '1 Place Vendôme, 75001 Paris', contactEmail: 'concierge@grandluxe.fr', contactPhone: '0145678904', colorCode: '#F59E0B', isActive: true },
  { id: 'c5', name: 'GNV SEALAND', imo: '9435454', billingAddress: 'Port de Barcelona, Moll 20A', contactEmail: 'ops@gnv.it', contactPhone: '0932000000', colorCode: '#8B5CF6', isActive: true },
];

let services = [
  mkService('s1', 'p2', 'c1', 'Transfert aéroport CDG', '12 Rue de la Paix, 75002 Paris', 'Aéroport CDG, Terminal 2', at(0, 8), at(0, 9, 30), 'Client avec 2 valises', 120),
  mkService('s2', 'p2', 'c2', 'Circuit touristique', 'Hôtel Grand Luxe, Place Vendôme', 'Tour Eiffel, Champ de Mars', at(0, 14), at(0, 17), 'Groupe de 4 personnes', 250),
  mkService('s3', 'p3', 'c3', 'Déplacement professionnel', '8 Bd Haussmann, 75009 Paris', 'La Défense, Tour First', at(0, 9), at(0, 9, 45), 'Rendez-vous à 10h00', 85),
  mkService('s4', 'p4', 'c4', 'Transfert gare', 'Gare de Lyon, 75012 Paris', 'Hôtel Grand Luxe, Place Vendôme', at(0, 11), at(0, 11, 30), 'VIP - champagne à bord', 150),
  mkService('s5', 'p2', null, 'Course particulière', '15 Rue de Rivoli, 75001 Paris', 'Orly, Terminal Sud', at(1, 6), at(1, 7), 'Départ très matinal', 95),
  mkService('s6', 'p3', 'c2', 'Navette hôtel', 'Gare Montparnasse', 'Hôtel Grand Luxe, Place Vendôme', at(1, 10), at(1, 10, 45), null, 70),
  mkService('s7', 'p4', 'c1', 'Transfert Orly', '20 Rue Oberkampf, 75011 Paris', 'Orly, Terminal Ouest', at(2, 15), at(2, 16), 'Retour de mission', 90),
  // Services pour GNV SEALAND (c5), positionnés dans des fenêtres d'escale réelles Portic
  mkService('s8', 'p2', 'c5', 'Relève équipage', 'Moll 19B, Port de Barcelona', 'Aeroport BCN T1', '2026-07-21T20:00:00+02:00', '2026-07-21T21:30:00+02:00', 'Escale GNV du 21/07', null),
  mkService('s9', 'p6', 'c5', 'Avitaillement', 'Moll 19B, Port de Barcelona', 'Zona Franca', '2026-07-21T21:15:00+02:00', '2026-07-21T22:15:00+02:00', null, null),
  mkService('s10', 'p3', 'c5', 'Control aduana', 'Moll 20A, Port de Barcelona', 'Duana del Port', '2026-07-22T19:30:00+02:00', '2026-07-22T20:30:00+02:00', null, null),
];

// Statuts variés pour illustrer les statistiques opérationnelles
services[2].status = 'TERMINE'; // s3
services[5].status = 'EN_COURS'; // s6
services[6].status = 'ANNULE'; // s7

let seqPersonnel = 9;
let seqClient = 5;
let seqService = 10;

function mkService(id, personnelId, clientId, title, pickup, dropoff, start, end, notes, price) {
  return {
    id,
    serviceCode: `SERV-${new Date(start).getFullYear()}-${String(id.replace('s', '')).padStart(3, '0')}`,
    personnelId,
    clientId,
    title,
    pickupLocation: pickup,
    dropoffLocation: dropoff,
    stops: [],
    startTime: start,
    endTime: end,
    notes,
    price,
    status: 'PLANIFIE',
    completedByDriver: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─────────────── Helpers ───────────────
const publicPersonnel = (p) => ({
  id: p.id, codeId: p.codeId, firstName: p.firstName, lastName: p.lastName,
  role: p.role, phone: p.phone, isActive: p.isActive,
  createdAt: p.createdAt || now.toISOString(), updatedAt: p.updatedAt || now.toISOString(),
});

function makeToken(user) {
  const payload = { userId: user.id, role: user.role, codeId: user.codeId };
  return 'mock.' + Buffer.from(JSON.stringify(payload)).toString('base64');
}
function readToken(req) {
  const raw = (req.headers.authorization || '').split(' ')[1] || req.query.token;
  if (!raw || !raw.startsWith('mock.')) return null;
  try {
    return JSON.parse(Buffer.from(raw.slice(5), 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}
function findChauffeur(id) {
  return personnel.find((p) => p.id === id);
}
function findClient(id) {
  return clients.find((c) => c.id === id);
}
const effEnd = (s) => (s.endTime ? new Date(s.endTime) : new Date(new Date(s.startTime).getTime() + DEFAULT_DURATION));
const dur = (s) => (effEnd(s) - new Date(s.startTime)) / HOUR;

// ─────────────── Health ───────────────
app.get('/health', (req, res) => res.json({ status: 'ok', mock: true, timestamp: new Date() }));

// ─────────────── Auth ───────────────
app.post('/api/v1/auth/login', (req, res) => {
  const code = req.body.codeId || req.body.code_id;
  const user = personnel.find((p) => p.codeId === code && p.role === 'DISPATCH' && p.isActive);
  if (!user || (user.pin && user.pin !== req.body.password)) {
    return res.status(401).json({ success: false, message: 'Identifiants invalides' });
  }
  res.json({ success: true, token: makeToken(user), user: publicPersonnel(user) });
});

app.post('/api/v1/auth/driver-login', (req, res) => {
  const code = req.body.codeId || req.body.code_id;
  const pin = req.body.pinCode ?? req.body.pin_code;
  const driver = personnel.find((p) => p.codeId === code && p.role === 'CHAUFFEUR' && p.isActive);
  if (!driver) return res.status(404).json({ success: false, message: 'Chauffeur non trouvé' });
  if (driver.pin && driver.pin !== (pin || '')) {
    return res.status(401).json({ success: false, message: 'PIN incorrect' });
  }
  res.json({ success: true, token: makeToken(driver), user: publicPersonnel(driver) });
});

app.get('/api/v1/auth/me', (req, res) => {
  const t = readToken(req);
  if (!t) return res.status(401).json({ success: false, message: 'Token manquant' });
  res.json({ success: true, user: publicPersonnel(findChauffeur(t.userId)) });
});

// ─────────────── Personnel ───────────────
app.get('/api/v1/personnel', (req, res) => {
  let data = personnel.slice();
  const { role, isActive, is_active, search } = req.query;
  if (role) data = data.filter((p) => p.role === role);
  const active = isActive ?? is_active;
  if (active !== undefined) data = data.filter((p) => String(p.isActive) === String(active));
  if (search) {
    const q = search.toLowerCase();
    data = data.filter((p) => `${p.firstName} ${p.lastName} ${p.codeId}`.toLowerCase().includes(q));
  }
  data.sort((a, b) => a.lastName.localeCompare(b.lastName));
  res.json({ success: true, data: data.map(publicPersonnel), total: data.length });
});

app.get('/api/v1/personnel/:id', (req, res) => {
  const p = findChauffeur(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Personnel non trouvé' });
  res.json({ success: true, data: publicPersonnel(p) });
});

app.post('/api/v1/personnel', (req, res) => {
  const b = req.body;
  const role = b.role || 'CHAUFFEUR';
  const prefix = role === 'DISPATCH' ? 'OP' : 'CH';
  seqPersonnel += 1;
  const p = {
    id: 'p' + Date.now(),
    codeId: `${prefix}-${String(seqPersonnel).padStart(3, '0')}`,
    firstName: b.firstName ?? b.first_name,
    lastName: b.lastName ?? b.last_name,
    role,
    phone: b.phone || null,
    pin: b.pinCode ?? b.pin_code ?? null,
    isActive: b.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  personnel.push(p);
  res.status(201).json({ success: true, data: publicPersonnel(p) });
});

app.put('/api/v1/personnel/:id', (req, res) => {
  const p = findChauffeur(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Personnel non trouvé' });
  const b = req.body;
  if (b.firstName !== undefined || b.first_name !== undefined) p.firstName = b.firstName ?? b.first_name;
  if (b.lastName !== undefined || b.last_name !== undefined) p.lastName = b.lastName ?? b.last_name;
  if (b.phone !== undefined) p.phone = b.phone;
  if ((b.pinCode ?? b.pin_code)) p.pin = b.pinCode ?? b.pin_code;
  if (b.isActive !== undefined || b.is_active !== undefined) p.isActive = b.isActive ?? b.is_active;
  p.updatedAt = new Date().toISOString();
  res.json({ success: true, data: publicPersonnel(p) });
});

app.delete('/api/v1/personnel/:id', (req, res) => {
  const p = findChauffeur(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Personnel non trouvé' });
  p.isActive = false;
  res.json({ success: true, message: 'Personnel archivé', data: publicPersonnel(p) });
});

// ─────────────── Clients ───────────────
app.get('/api/v1/clients', (req, res) => {
  let data = clients.slice();
  const active = req.query.isActive ?? req.query.is_active;
  if (active !== undefined) data = data.filter((c) => String(c.isActive) === String(active));
  data.sort((a, b) => a.name.localeCompare(b.name));
  res.json({ success: true, data, total: data.length });
});

app.get('/api/v1/clients/:id', (req, res) => {
  const c = findClient(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Client non trouvé' });
  res.json({ success: true, data: c });
});

app.post('/api/v1/clients', (req, res) => {
  const b = req.body;
  seqClient += 1;
  const c = {
    id: 'c' + Date.now(),
    name: b.name,
    billingAddress: b.billingAddress ?? b.billing_address ?? null,
    contactEmail: b.contactEmail ?? b.contact_email ?? null,
    contactPhone: b.contactPhone ?? b.contact_phone ?? null,
    colorCode: b.colorCode ?? b.color_code ?? '#3B82F6',
    isActive: true,
  };
  clients.push(c);
  res.status(201).json({ success: true, data: c });
});

app.put('/api/v1/clients/:id', (req, res) => {
  const c = findClient(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Client non trouvé' });
  const b = req.body;
  Object.assign(c, {
    name: b.name ?? c.name,
    billingAddress: b.billingAddress ?? b.billing_address ?? c.billingAddress,
    contactEmail: b.contactEmail ?? b.contact_email ?? c.contactEmail,
    contactPhone: b.contactPhone ?? b.contact_phone ?? c.contactPhone,
    colorCode: b.colorCode ?? b.color_code ?? c.colorCode,
    isActive: b.isActive ?? c.isActive,
  });
  res.json({ success: true, data: c });
});

app.delete('/api/v1/clients/:id', (req, res) => {
  const c = findClient(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Client non trouvé' });
  c.isActive = false;
  res.json({ success: true, message: 'Client archivé', data: c });
});

// ─────────────── Services ───────────────
function serviceWithRelations(s) {
  const ch = findChauffeur(s.personnelId);
  const cl = s.clientId ? findClient(s.clientId) : null;
  return {
    ...s,
    chauffeur: ch ? { id: ch.id, codeId: ch.codeId, firstName: ch.firstName, lastName: ch.lastName } : null,
    client: cl ? { id: cl.id, name: cl.name, colorCode: cl.colorCode } : null,
  };
}

app.get('/api/v1/services', (req, res) => {
  let data = services.slice();
  const { personnelId, personnel_id, clientId, client_id, status, startDate, start_date, endDate, end_date } = req.query;
  const pid = personnelId ?? personnel_id;
  const cid = clientId ?? client_id;
  if (pid) data = data.filter((s) => s.personnelId === pid);
  if (cid) data = data.filter((s) => s.clientId === cid);
  if (status) data = data.filter((s) => s.status === status);
  const sd = startDate ?? start_date;
  const ed = endDate ?? end_date;
  if (sd) data = data.filter((s) => new Date(s.startTime) >= new Date(sd));
  if (ed) data = data.filter((s) => new Date(s.startTime) <= new Date(ed + 'T23:59:59'));
  data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  res.json({ success: true, data: data.map(serviceWithRelations), total: data.length });
});

app.get('/api/v1/services/:id', (req, res) => {
  const s = services.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Service non trouvé' });
  res.json({ success: true, data: serviceWithRelations(s) });
});

app.post('/api/v1/services', (req, res) => {
  const b = req.body;
  const personnelId = b.personnelId ?? b.personnel_id;
  const startTime = b.startTime ?? b.start_time;
  const normalized = {
    title: b.title,
    pickupLocation: b.pickupLocation ?? b.pickup_location,
    dropoffLocation: b.dropoffLocation ?? b.dropoff_location,
    notes: b.notes,
    stops: b.stops,
  };
  if (!personnelId) return res.status(400).json({ success: false, message: 'Le chauffeur est requis' });
  if (!startTime) return res.status(400).json({ success: false, message: "L'heure de début est requise" });
  if (!hasAtLeastOneInfo(normalized)) {
    return res.status(400).json({ success: false, message: 'Renseignez au moins un titre, une adresse ou une note' });
  }

  const end = (b.endTime ?? b.end_time) || new Date(new Date(startTime).getTime() + DEFAULT_DURATION).toISOString();
  seqService += 1;
  const s = {
    id: 's' + Date.now(),
    serviceCode: `SERV-${new Date().getFullYear()}-${String(seqService).padStart(3, '0')}`,
    personnelId,
    clientId: b.clientId ?? b.client_id ?? null,
    title: normalized.title?.trim() || null,
    pickupLocation: normalized.pickupLocation?.trim() || null,
    dropoffLocation: normalized.dropoffLocation?.trim() || null,
    stops: normalizeStops(normalized.stops),
    startTime,
    endTime: end,
    notes: normalized.notes?.trim() || null,
    price: b.price === '' || b.price == null ? null : Number(b.price),
    status: 'PLANIFIE',
    completedByDriver: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  services.push(s);
  res.status(201).json({ success: true, data: serviceWithRelations(s) });
});

app.put('/api/v1/services/:id', (req, res) => {
  const s = services.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Service non trouvé' });
  const b = req.body;
  const map = {
    personnelId: b.personnelId ?? b.personnel_id,
    clientId: b.clientId ?? b.client_id,
    title: b.title,
    pickupLocation: b.pickupLocation ?? b.pickup_location,
    dropoffLocation: b.dropoffLocation ?? b.dropoff_location,
    startTime: b.startTime ?? b.start_time,
    endTime: b.endTime ?? b.end_time,
    notes: b.notes,
    status: b.status,
  };
  for (const [k, v] of Object.entries(map)) if (v !== undefined) s[k] = v;
  if (b.stops !== undefined) s.stops = normalizeStops(b.stops);
  if (b.price !== undefined) s.price = b.price === '' || b.price === null ? null : Number(b.price);
  s.updatedAt = new Date().toISOString();
  res.json({ success: true, data: serviceWithRelations(s) });
});

app.delete('/api/v1/services/:id', (req, res) => {
  const s = services.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Service non trouvé' });
  s.status = 'ANNULE';
  res.json({ success: true, message: 'Service annulé', data: serviceWithRelations(s) });
});

// ─────────────── Calendrier ───────────────
app.get('/api/v1/calendar/services', (req, res) => {
  const { start, end, personnelId, personnel_id } = req.query;
  const pid = personnelId ?? personnel_id;
  let data = services.filter((s) => s.status !== 'ANNULE');
  if (pid) data = data.filter((s) => s.personnelId === pid);
  if (start) data = data.filter((s) => new Date(s.startTime) >= new Date(start));
  if (end) data = data.filter((s) => new Date(s.startTime) <= new Date(end));

  const events = data.map((s) => {
    const ch = findChauffeur(s.personnelId);
    const cl = s.clientId ? findClient(s.clientId) : null;
    return {
      id: s.id,
      title: `${s.serviceCode} - ${s.title || s.pickupLocation || s.dropoffLocation || 'Service'}`,
      start: new Date(s.startTime).toISOString(),
      end: effEnd(s).toISOString(),
      color: cl?.colorCode || '#3B82F6',
      extendedProps: {
        serviceCode: s.serviceCode,
        title: s.title,
        chauffeurId: s.personnelId,
        chauffeurName: ch ? `${ch.firstName} ${ch.lastName}` : '',
        clientId: cl?.id || null,
        clientName: cl?.name || 'Particulier',
        pickupLocation: s.pickupLocation,
        dropoffLocation: s.dropoffLocation,
        stops: s.stops || [],
        price: s.price,
        notes: s.notes,
        status: s.status,
      },
    };
  });
  res.json(events);
});

// ─────────────── Statistiques ───────────────
function inPeriod(list, sd, ed) {
  return list.filter((s) => {
    const t = new Date(s.startTime);
    if (sd && t < new Date(sd)) return false;
    if (ed && t > new Date(ed + 'T23:59:59')) return false;
    return true;
  });
}

const emptyStatus = () => ({ PLANIFIE: 0, EN_COURS: 0, TERMINE: 0, ANNULE: 0 });

app.get('/api/v1/stats/dashboard', (req, res) => {
  const sd = req.query.startDate ?? req.query.start_date;
  const ed = req.query.endDate ?? req.query.end_date;
  const inRange = inPeriod(services, sd, ed);

  const byStatus = emptyStatus();
  inRange.forEach((s) => (byStatus[s.status] = (byStatus[s.status] || 0) + 1));

  res.json({
    total_services: inRange.length,
    services_by_status: byStatus,
    services_done: byStatus.TERMINE,
    services_cancelled: byStatus.ANNULE,
    services_in_progress: byStatus.EN_COURS,
    services_planned: byStatus.PLANIFIE,
    active_drivers: personnel.filter((p) => p.role === 'CHAUFFEUR' && p.isActive).length,
  });
});

app.get('/api/v1/stats/by-driver', (req, res) => {
  const sd = req.query.startDate ?? req.query.start_date;
  const ed = req.query.endDate ?? req.query.end_date;
  const inRange = inPeriod(services, sd, ed);
  const drivers = personnel.filter((p) => p.role === 'CHAUFFEUR');
  res.json(
    drivers.map((d) => {
      const own = inRange.filter((s) => s.personnelId === d.id);
      const byStatus = emptyStatus();
      own.forEach((s) => (byStatus[s.status] = (byStatus[s.status] || 0) + 1));
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
    })
  );
});

// ─────────────── Exports ───────────────
function exportRows(sd, ed) {
  return inPeriod(services, sd, ed)
    .filter((s) => s.status !== 'ANNULE')
    .map((s) => {
      const ch = findChauffeur(s.personnelId);
      const cl = s.clientId ? findClient(s.clientId) : null;
      return {
        'N° Service': s.serviceCode,
        Date: new Date(s.startTime).toISOString().split('T')[0],
        Chauffeur: ch ? `${ch.firstName} ${ch.lastName}` : '',
        Client: cl?.name || 'Particulier',
        Départ: s.pickupLocation,
        Destination: s.dropoffLocation,
        'Montant (€)': s.price || 0,
        'Durée (h)': Number(dur(s).toFixed(2)),
        Statut: s.status,
      };
    });
}

app.get('/api/v1/exports/excel', (req, res) => {
  const rows = exportRows(req.query.startDate ?? req.query.start_date, req.query.endDate ?? req.query.end_date);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Services');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="export_mock_${Date.now()}.xlsx"`);
  res.send(buf);
});

app.get('/api/v1/exports/csv', (req, res) => {
  const rows = exportRows(req.query.startDate ?? req.query.start_date, req.query.endDate ?? req.query.end_date);
  const headers = Object.keys(rows[0] || { Info: 'Aucune donnée' });
  const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => r[h]).join(';'))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="export_mock_${Date.now()}.csv"`);
  res.send('﻿' + csv);
});

// ─────────────── Chauffeur (mobile) ───────────────
app.get('/api/v1/driver/agenda', (req, res) => {
  const t = readToken(req);
  if (!t) return res.status(401).json({ success: false, message: 'Token manquant' });
  const date = req.query.date ? new Date(req.query.date + 'T00:00:00') : new Date();
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);

  const data = services
    .filter((s) => s.personnelId === t.userId && s.status !== 'ANNULE')
    .filter((s) => { const d = new Date(s.startTime); return d >= dayStart && d <= dayEnd; })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .map((s) => {
      const cl = s.clientId ? findClient(s.clientId) : null;
      return {
        id: s.id,
        service_code: s.serviceCode,
        title: s.title || s.pickupLocation || s.dropoffLocation || 'Service',
        status: s.status,
        start_time: new Date(s.startTime).toISOString(),
        end_time: s.endTime ? new Date(s.endTime).toISOString() : null,
        pickup_location: s.pickupLocation,
        dropoff_location: s.dropoffLocation,
        stops: s.stops || [],
        notes: s.notes,
        client_name: cl?.name || 'Particulier',
        completed_by_driver: s.completedByDriver,
        gps_url: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.dropoffLocation || s.pickupLocation || '')}`,
      };
    });
  res.json({ success: true, data });
});

app.patch('/api/v1/driver/services/:id/complete', (req, res) => {
  const t = readToken(req);
  if (!t) return res.status(401).json({ success: false, message: 'Token manquant' });
  const s = services.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ success: false, message: 'Service non trouvé' });
  if (s.personnelId !== t.userId) return res.status(403).json({ success: false, message: 'Non autorisé' });
  s.completedByDriver = req.body.completed ?? true;
  res.json({ success: true, data: { id: s.id, completedByDriver: s.completedByDriver } });
});

// ─────────────── Facturation (groupes par escale Portic) ───────────────
const fmtDate = (iso) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
const fmtTime = (iso) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function serviceBrief(s) {
  const ch = findChauffeur(s.personnelId);
  return {
    id: s.id,
    serviceCode: s.serviceCode,
    title: s.title,
    status: s.status,
    startTime: s.startTime,
    endTime: s.endTime,
    driverCode: ch?.codeId || '',
    driverName: ch ? `${ch.firstName} ${ch.lastName}` : '',
    pickup: s.pickupLocation,
    dropoff: s.dropoffLocation,
    stops: s.stops || [],
  };
}

async function computeFacturation(client, from, to) {
  const escalas = await portic.fetchEscalas(client.name, client.imo);
  const fromD = from ? new Date(`${from}T00:00:00`) : null;
  const toD = to ? new Date(`${to}T23:59:59`) : null;
  const inRange = escalas.filter(
    (e) => e.eta && (!fromD || (e.etd || e.eta) >= fromD) && (!toD || e.eta <= toD)
  );
  const svc = services.filter((s) => s.clientId === client.id && s.status !== 'ANNULE');
  const matched = new Set();

  const groups = inRange.map((e) => {
    const list = svc.filter((s) => {
      const t = new Date(s.startTime);
      return e.eta && e.etd && t >= e.eta && t <= e.etd;
    });
    list.forEach((s) => matched.add(s.id));
    return {
      portCall: { ...e, eta: e.eta?.toISOString(), etd: e.etd?.toISOString() },
      services: list.map(serviceBrief),
    };
  });

  const unmatched = svc
    .filter((s) => {
      if (matched.has(s.id)) return false;
      const t = new Date(s.startTime);
      if (fromD && t < fromD) return false;
      if (toD && t > toD) return false;
      return true;
    })
    .map(serviceBrief);

  return {
    vessel: {
      name: client.name,
      imo: client.imo || escalas[0]?.imo || null,
      consignatari: escalas[0]?.consignatari || null,
      armador: escalas[0]?.armador || null,
    },
    groups,
    unmatched,
    totalEscalas: escalas.length,
  };
}

app.get('/api/v1/facturation/portcalls', async (req, res) => {
  const client = findClient(req.query.clientId);
  if (!client) return res.status(404).json({ success: false, message: 'Navire (client) introuvable' });
  try {
    const data = await computeFacturation(client, req.query.from, req.query.to);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(502).json({ success: false, message: 'Portic injoignable : ' + e.message });
  }
});

app.get('/api/v1/facturation/export', async (req, res) => {
  const client = findClient(req.query.clientId);
  if (!client) return res.status(404).json({ success: false, message: 'Navire introuvable' });
  try {
    const { vessel, groups } = await computeFacturation(client, req.query.from, req.query.to);
    const billable = groups.filter((g) => g.services.length > 0);

    const aoa = [];
    aoa.push(['FACTURATION — Prestations par escale']);
    aoa.push(['Navire', vessel.name, 'IMO', vessel.imo || '']);
    aoa.push(['Consignataire', vessel.consignatari || '', 'Armateur', vessel.armador || '']);
    aoa.push(['Période', `${req.query.from || '—'} → ${req.query.to || '—'}`]);
    aoa.push([]);

    let grandTotal = 0;
    for (const g of billable) {
      const pc = g.portCall;
      aoa.push([`ESCALE : ${fmtDate(pc.eta)} ${fmtTime(pc.eta)} → ${fmtDate(pc.etd)} ${fmtTime(pc.etd)}`, '', `Muelle ${pc.muelle || '-'}`, pc.tipo || '']);
      aoa.push(['N° Service', 'Date', 'Heure', 'Chauffeur', 'Prestation', 'Départ', 'Destination', 'Statut']);
      for (const s of g.services) {
        aoa.push([
          s.serviceCode,
          fmtDate(s.startTime),
          fmtTime(s.startTime),
          `${s.driverCode} ${s.driverName}`.trim(),
          s.title || '',
          s.pickup || '',
          s.dropoff || '',
          s.status,
        ]);
        grandTotal++;
      }
      aoa.push(['', '', '', '', '', '', 'Sous-total prestations', g.services.length]);
      aoa.push([]);
    }
    aoa.push(['', '', '', '', '', '', 'TOTAL PRESTATIONS', grandTotal]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 24 }, { wch: 26 }, { wch: 26 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facturation');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res
      .setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .setHeader('Content-Disposition', `attachment; filename="facturation_${client.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx"`)
      .send(buf);
  } catch (e) {
    res.status(502).json({ success: false, message: 'Portic injoignable : ' + e.message });
  }
});

// ─────────────── Roster / Jours de travail (shifts) ───────────────
const DEFAULT_SHIFTS = [
  { key: 'JOUR', label: 'Jour', start: '05:00', end: '15:00', min: 3 },
  { key: 'SOIR', label: 'Soir', start: '15:00', end: '02:00', min: 2 },
];
const DEFAULT_RULES = { maxConsecutive: 6, restAfterWeekendWork: true, weekendRestPerMonth: true };
// Profil par défaut d'un chauffeur (modifiable par l'opérateur, par chauffeur)
const DEFAULT_PROFILE = {
  mode: 'ROTATING', // 'ROTATING' (tourne sur les shifts) | 'FIXED' (planning fixe)
  allowedShifts: null, // ROTATING : shifts autorisés (null = tous)
  fixedShift: null, // FIXED : shift imposé (ex: 'JOUR')
  fixedDays: [1, 2, 3, 4, 5], // FIXED : jours travaillés (0=dim … 6=sam)
  weekendOff: true, // garantir au moins un week-end entier de repos
  maxPerMonth: null, // plafond de shifts sur le mois
  unavailable: [], // dates 'YYYY-MM-DD' d'indisponibilité
};
let rosters = {}; // month 'YYYY-MM' -> roster
let driverProfiles = {}; // driverId -> profile (config persistante)

function monthDays(year, month) {
  const n = new Date(year, month, 0).getDate();
  const arr = [];
  for (let i = 1; i <= n; i++) {
    const dt = new Date(year, month - 1, i);
    const dow = dt.getDay();
    arr.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      dow,
      isWeekend: dow === 0 || dow === 6,
    });
  }
  return arr;
}

function coverageWarnings(roster) {
  const warnings = [];
  const [year, month] = roster.month.split('-').map(Number);
  for (const day of monthDays(year, month)) {
    for (const shift of roster.shifts) {
      const n = roster.entries.filter((e) => e.date === day.date && e.shift === shift.key).length;
      if (n < (shift.min || 0)) warnings.push(`${day.date} · ${shift.label} : ${n}/${shift.min} chauffeurs`);
    }
  }
  return warnings;
}

// Regroupe les jours de week-end consécutifs (sam+dim → un "week-end")
function weekendUnits(days) {
  const units = [];
  let cur = [];
  days.forEach((d) => {
    if (d.isWeekend) cur.push(d.date);
    else if (cur.length) { units.push(cur); cur = []; }
  });
  if (cur.length) units.push(cur);
  return units;
}

function buildRoster(monthStr, opts = {}) {
  const [year, month] = monthStr.split('-').map(Number);
  const shifts = opts.shifts?.length ? opts.shifts : DEFAULT_SHIFTS;
  const shiftKeys = shifts.map((s) => s.key);
  const rules = { ...DEFAULT_RULES, ...(opts.rules || {}) };
  const locks = opts.locks || {};
  const profilesIn = { ...driverProfiles, ...(opts.profiles || {}) };

  let drivers = personnel.filter((p) => p.role === 'CHAUFFEUR' && p.isActive);
  if (opts.driverIds?.length) drivers = drivers.filter((d) => opts.driverIds.includes(d.id));

  const days = monthDays(year, month);
  const key = (id, date) => `${id}:${date}`;
  const prof = (d) => ({ ...DEFAULT_PROFILE, ...(profilesIn[d.id] || {}) });
  const allowed = (d) => {
    const p = prof(d);
    return p.allowedShifts?.length ? p.allowedShifts : shiftKeys;
  };

  const entries = {};
  const reserved = {}; // repos garanti (week-end)
  const stat = {};
  drivers.forEach((d) => (stat[d.id] = { shifts: 0, byShift: {}, weekend: 0, weekendOff: false, streak: 0 }));

  // 1) Réservation d'un week-end de repos, réparti dans le mois (round-robin)
  const wUnits = weekendUnits(days);
  const wkDrivers = drivers.filter((d) => prof(d).weekendOff && prof(d).mode === 'ROTATING');
  if (rules.weekendRestPerMonth && wUnits.length) {
    wkDrivers.forEach((d, i) => {
      wUnits[i % wUnits.length].forEach((date) => {
        if (!locks[key(d.id, date)]) reserved[key(d.id, date)] = true;
      });
    });
  }

  const workedPrevDay = (id, idx) => idx > 0 && !['REPOS', undefined].includes(entries[key(id, days[idx - 1].date)]);

  // 2) Attribution jour par jour
  days.forEach((day, idx) => {
    const assigned = new Set();

    // a) Exceptions opérateur (locks) — priorité absolue
    drivers.forEach((d) => {
      const lk = locks[key(d.id, day.date)];
      if (lk) { entries[key(d.id, day.date)] = lk; if (lk !== 'REPOS') assigned.add(d.id); }
    });

    // b) Chauffeurs à planning FIXE
    drivers.forEach((d) => {
      if (entries[key(d.id, day.date)]) return;
      const p = prof(d);
      if (p.mode !== 'FIXED') return;
      const works = p.fixedDays.includes(day.dow) && !p.unavailable.includes(day.date) && p.fixedShift;
      entries[key(d.id, day.date)] = works ? p.fixedShift : 'REPOS';
      if (works) assigned.add(d.id);
    });

    // c) Repos réservé (week-end garanti)
    drivers.forEach((d) => {
      if (!entries[key(d.id, day.date)] && reserved[key(d.id, day.date)]) entries[key(d.id, day.date)] = 'REPOS';
    });

    const mondayPenalty = (d) => (rules.restAfterWeekendWork && day.dow === 1 && workedPrevDay(d.id, idx) ? 1 : 0);
    const eligible = (d) => {
      const p = prof(d);
      if (p.mode === 'FIXED') return false;
      if (assigned.has(d.id) || entries[key(d.id, day.date)]) return false;
      if (p.unavailable.includes(day.date)) return false;
      if (stat[d.id].streak >= rules.maxConsecutive) return false;
      if (p.maxPerMonth != null && stat[d.id].shifts >= p.maxPerMonth) return false;
      return true;
    };

    // d) Remplissage des shifts, priorité au jour (1er shift = min le plus élevé)
    for (const shift of shifts) {
      const already = drivers.filter((d) => entries[key(d.id, day.date)] === shift.key).length;
      let need = Math.max(0, (shift.min || 0) - already);
      if (need === 0) continue;
      const cands = drivers.filter((d) => eligible(d) && allowed(d).includes(shift.key));
      cands.sort((a, b) => {
        const ma = mondayPenalty(a), mb = mondayPenalty(b);
        if (ma !== mb) return ma - mb;
        // Rotation : privilégier qui a le moins fait CE shift (évite "toujours de nuit")
        const sa = stat[a.id].byShift[shift.key] || 0, sb = stat[b.id].byShift[shift.key] || 0;
        if (sa !== sb) return sa - sb;
        if (day.isWeekend && stat[a.id].weekend !== stat[b.id].weekend) return stat[a.id].weekend - stat[b.id].weekend;
        return stat[a.id].shifts - stat[b.id].shifts; // équité globale
      });
      for (const d of cands) {
        if (need <= 0) break;
        entries[key(d.id, day.date)] = shift.key;
        assigned.add(d.id);
        need--;
      }
    }

    // e) Repos pour les non affectés + compteurs
    drivers.forEach((d) => {
      const k = key(d.id, day.date);
      if (!entries[k]) entries[k] = 'REPOS';
      const v = entries[k];
      if (v === 'REPOS') { stat[d.id].streak = 0; if (day.isWeekend) stat[d.id].weekendOff = true; }
      else {
        stat[d.id].shifts++;
        stat[d.id].streak++;
        stat[d.id].byShift[v] = (stat[d.id].byShift[v] || 0) + 1;
        if (day.isWeekend) stat[d.id].weekend++;
      }
    });
  });

  const entryList = [];
  drivers.forEach((d) =>
    days.forEach((day) =>
      entryList.push({
        personnelId: d.id,
        date: day.date,
        shift: entries[key(d.id, day.date)] || 'REPOS',
        locked: !!locks[key(d.id, day.date)],
      })
    )
  );

  const roster = {
    month: monthStr,
    shifts,
    rules,
    drivers: drivers.map((d) => ({ id: d.id, codeId: d.codeId, name: `${d.firstName} ${d.lastName}`, profile: prof(d) })),
    entries: entryList,
    stats: drivers.map((d) => ({
      personnelId: d.id,
      codeId: d.codeId,
      shifts: stat[d.id].shifts,
      byShift: stat[d.id].byShift,
      weekend: stat[d.id].weekend,
      weekendOff: stat[d.id].weekendOff,
    })),
  };
  roster.warnings = coverageWarnings(roster);
  // Avertissement si un chauffeur n'a aucun repos le week-end
  roster.stats.forEach((s) => {
    if (!s.weekendOff) roster.warnings.push(`${s.codeId} : aucun repos le week-end ce mois-ci`);
  });
  return roster;
}

app.get('/api/v1/roster', (req, res) => {
  const month = req.query.month;
  if (!month) return res.status(400).json({ success: false, message: 'Paramètre month requis (YYYY-MM)' });
  res.json(rosters[month] || buildRoster(month));
});

app.post('/api/v1/roster/generate', (req, res) => {
  const { month } = req.body;
  if (!month) return res.status(400).json({ success: false, message: 'month requis' });
  const { shifts, rules, locks, profiles, driverIds } = req.body;
  const roster = buildRoster(month, { shifts, rules, locks, profiles, driverIds });
  rosters[month] = roster;
  res.json(roster);
});

// Profils des chauffeurs (planning fixe, week-end garanti, indispos, etc.)
app.get('/api/v1/roster/profiles', (req, res) => {
  const drivers = personnel.filter((p) => p.role === 'CHAUFFEUR' && p.isActive);
  res.json({
    success: true,
    shifts: DEFAULT_SHIFTS,
    profiles: drivers.map((d) => ({
      personnelId: d.id,
      codeId: d.codeId,
      name: `${d.firstName} ${d.lastName}`,
      profile: { ...DEFAULT_PROFILE, ...(driverProfiles[d.id] || {}) },
    })),
  });
});

app.put('/api/v1/roster/profiles', (req, res) => {
  const { personnelId, profile } = req.body;
  if (!personnelId || !profile) return res.status(400).json({ success: false, message: 'personnelId et profile requis' });
  driverProfiles[personnelId] = { ...DEFAULT_PROFILE, ...(driverProfiles[personnelId] || {}), ...profile };
  res.json({ success: true, personnelId, profile: driverProfiles[personnelId] });
});

app.put('/api/v1/roster/entry', (req, res) => {
  const { month, personnelId, date, shift } = req.body;
  if (!month || !personnelId || !date || !shift) {
    return res.status(400).json({ success: false, message: 'month, personnelId, date, shift requis' });
  }
  const roster = rosters[month] || (rosters[month] = buildRoster(month));
  const e = roster.entries.find((x) => x.personnelId === personnelId && x.date === date);
  if (e) {
    e.shift = shift;
    e.locked = true;
  } else {
    roster.entries.push({ personnelId, date, shift, locked: true });
  }
  roster.warnings = coverageWarnings(roster);
  res.json(roster);
});

// ─────────────── 404 ───────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route non trouvée (mock)' }));

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Serveur API FACTICE — Planning Transport         ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║   http://localhost:${PORT}                            ║`);
  console.log('║   Données en mémoire (réinitialisées au redémarrage)║');
  console.log('║   Dispatch : OP-001 / 1234                         ║');
  console.log('║   Chauffeur: CH-001 / 0000                         ║');
  console.log('╚════════════════════════════════════════════════════╝');
});
