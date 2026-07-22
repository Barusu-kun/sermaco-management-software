// prisma/seed.js — Données de test
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hash(pin) {
  return pin ? bcrypt.hash(pin, 10) : null;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ── Nettoyage (ordre respectant les FK) ──
  await prisma.auditLog.deleteMany();
  await prisma.service.deleteMany();
  await prisma.client.deleteMany();
  await prisma.personnel.deleteMany();

  // ── Personnel ──
  const personnel = [
    { codeId: 'OP-001', firstName: 'Marie', lastName: 'Dupont', role: 'DISPATCH', phone: '0612345678', pinCode: '1234', isActive: true },
    { codeId: 'CH-001', firstName: 'Jean', lastName: 'Martin', role: 'CHAUFFEUR', phone: '0623456789', pinCode: '0000', isActive: true },
    { codeId: 'CH-002', firstName: 'Pierre', lastName: 'Bernard', role: 'CHAUFFEUR', phone: '0634567890', pinCode: null, isActive: true },
    { codeId: 'CH-003', firstName: 'Sophie', lastName: 'Petit', role: 'CHAUFFEUR', phone: '0645678901', pinCode: '1111', isActive: true },
    { codeId: 'CH-004', firstName: 'Lucas', lastName: 'Moreau', role: 'CHAUFFEUR', phone: '0656789012', pinCode: null, isActive: false },
  ];

  const createdPersonnel = {};
  for (const p of personnel) {
    const rec = await prisma.personnel.create({
      data: { ...p, pinCode: await hash(p.pinCode) },
    });
    createdPersonnel[p.codeId] = rec;
  }

  // ── Clients ──
  const clientsData = [
    { name: 'Transport Express SA', billingAddress: '12 Rue de la Paix, 75002 Paris', contactEmail: 'contact@transport-express.fr', contactPhone: '0145678901', colorCode: '#EF4444' },
    { name: 'Voyages Deluxe', billingAddress: '45 Avenue des Champs-Élysées, 75008 Paris', contactEmail: 'reservations@voyages-deluxe.fr', contactPhone: '0145678902', colorCode: '#3B82F6' },
    { name: 'Entreprise Dupont & Fils', billingAddress: '8 Boulevard Haussmann, 75009 Paris', contactEmail: 'secretariat@dupont-fils.fr', contactPhone: '0145678903', colorCode: '#10B981' },
    { name: 'Hôtel Grand Luxe', billingAddress: '1 Place Vendôme, 75001 Paris', contactEmail: 'concierge@grandluxe.fr', contactPhone: '0145678904', colorCode: '#F59E0B' },
  ];

  const createdClients = {};
  for (const c of clientsData) {
    const rec = await prisma.client.create({ data: c });
    createdClients[c.name] = rec;
  }

  // ── Services ──
  const servicesData = [
    { code: 'SERV-2026-001', ch: 'CH-001', client: 'Transport Express SA', title: 'Transfert aéroport CDG', pickup: '12 Rue de la Paix, 75002 Paris', dropoff: 'Aéroport Charles de Gaulle, Terminal 2', start: '2026-07-21T08:00:00+02:00', end: '2026-07-21T09:30:00+02:00', notes: 'Client avec 2 valises', price: 120.0 },
    { code: 'SERV-2026-002', ch: 'CH-001', client: 'Voyages Deluxe', title: 'Circuit touristique', pickup: 'Hôtel Grand Luxe, 1 Place Vendôme', dropoff: 'Tour Eiffel, Champ de Mars', start: '2026-07-21T14:00:00+02:00', end: '2026-07-21T17:00:00+02:00', notes: 'Groupe de 4 personnes', price: 250.0 },
    { code: 'SERV-2026-003', ch: 'CH-002', client: 'Entreprise Dupont & Fils', title: 'Déplacement professionnel', pickup: '8 Boulevard Haussmann, 75009 Paris', dropoff: 'La Défense, Tour First', start: '2026-07-21T09:00:00+02:00', end: '2026-07-21T09:45:00+02:00', notes: 'Rendez-vous à 10h00', price: 85.0 },
    { code: 'SERV-2026-004', ch: 'CH-003', client: 'Hôtel Grand Luxe', title: 'Transfert gare', pickup: 'Gare de Lyon, 75012 Paris', dropoff: 'Hôtel Grand Luxe, 1 Place Vendôme', start: '2026-07-21T11:00:00+02:00', end: '2026-07-21T11:30:00+02:00', notes: 'VIP - champagne à bord', price: 150.0 },
    { code: 'SERV-2026-005', ch: 'CH-001', client: null, title: 'Course particulière', pickup: '15 Rue de Rivoli, 75001 Paris', dropoff: 'Orly Airport, Terminal Sud', start: '2026-07-22T06:00:00+02:00', end: '2026-07-22T07:00:00+02:00', notes: 'Départ très matinal', price: 95.0 },
  ];

  for (const s of servicesData) {
    await prisma.service.create({
      data: {
        serviceCode: s.code,
        personnelId: createdPersonnel[s.ch].id,
        clientId: s.client ? createdClients[s.client].id : null,
        title: s.title,
        pickupLocation: s.pickup,
        dropoffLocation: s.dropoff,
        startTime: new Date(s.start),
        endTime: s.end ? new Date(s.end) : null,
        notes: s.notes,
        price: s.price,
        status: 'PLANIFIE',
      },
    });
  }

  console.log('✅ Seed terminé.');
  console.log('   Dispatch  → code: OP-001 / mot de passe: 1234');
  console.log('   Chauffeur → code: CH-001 / PIN: 0000');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
