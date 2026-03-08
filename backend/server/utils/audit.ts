/**
 * Audit Logger - Records all admin and sensitive actions
 * SSOT Section 9: NFR - Audit logging on all admin actions
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/schema.js';

export async function logAudit(params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}): Promise<void> {
  const db = getDb();
  await db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(),
    params.userId || null,
    params.action,
    params.entityType,
    params.entityId || null,
    params.oldValue || null,
    params.newValue || null,
    params.ipAddress || null,
  );
}
