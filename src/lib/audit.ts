import { query } from './db';
import type { JWTPayload } from '@/types';

export async function logAudit(
    actor: JWTPayload | null,
    action: string,
    entityType?: string,
    entityId?: number,
    detail?: Record<string, unknown>,
    ipAddress?: string
) {
    try {
        await query(
            `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, detail_json, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                actor ? parseInt(actor.sub) : null,
                action,
                entityType ?? null,
                entityId ?? null,
                detail ? JSON.stringify(detail) : null,
                ipAddress ?? null,
            ]
        );
    } catch (err) {
        // Audit log failure should not break main flow
        console.error('[audit] Failed to write audit log:', err);
    }
}
