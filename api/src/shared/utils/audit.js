// src/shared/utils/audit.js
// Journalisation applicative des modifications dans la table audit_log.

/**
 * Enregistre une entrée d'audit. N'interrompt jamais l'opération principale.
 * @param {import('@prisma/client').Prisma.TransactionClient} client
 * @param {{ tableName: string, recordId: string, action: 'INSERT'|'UPDATE'|'DELETE', oldData?: object, newData?: object, performedById?: string }} entry
 */
async function writeAudit(client, entry) {
  try {
    await client.auditLog.create({
      data: {
        tableName: entry.tableName,
        recordId: entry.recordId,
        action: entry.action,
        oldData: entry.oldData ? JSON.parse(JSON.stringify(entry.oldData)) : undefined,
        newData: entry.newData ? JSON.parse(JSON.stringify(entry.newData)) : undefined,
        performedById: entry.performedById || null,
      },
    });
  } catch (err) {
    console.error('⚠️  Audit log échoué:', err.message);
  }
}

module.exports = { writeAudit };
