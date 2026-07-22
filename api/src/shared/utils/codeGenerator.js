// src/shared/utils/codeGenerator.js
// Génération applicative des identifiants (remplace les triggers PostgreSQL
// lorsque le schéma est géré par Prisma migrate).

/**
 * Génère le code_id d'un membre du personnel (ex: CH-001, OP-001).
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {'DISPATCH'|'CHAUFFEUR'} role
 */
async function generatePersonnelCode(tx, role) {
  const prefix = role === 'DISPATCH' ? 'OP' : 'CH';
  const last = await tx.personnel.findFirst({
    where: { codeId: { startsWith: `${prefix}-` } },
    orderBy: { codeId: 'desc' },
    select: { codeId: true },
  });

  let next = 1;
  if (last) {
    const num = parseInt(last.codeId.split('-')[1], 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

/**
 * Génère le service_code (ex: SERV-2026-089).
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {Date} startTime
 */
async function generateServiceCode(tx, startTime) {
  const year = new Date(startTime).getFullYear();
  const last = await tx.service.findFirst({
    where: { serviceCode: { startsWith: `SERV-${year}-` } },
    orderBy: { serviceCode: 'desc' },
    select: { serviceCode: true },
  });

  let next = 1;
  if (last) {
    const num = parseInt(last.serviceCode.split('-')[2], 10);
    if (!Number.isNaN(num)) next = num + 1;
  }
  return `SERV-${year}-${String(next).padStart(3, '0')}`;
}

module.exports = { generatePersonnelCode, generateServiceCode };
