// utils/logger/dbLogger.ts
import { sequelize } from "../../database/db";
import { QueryTypes } from 'sequelize';
import { asyncLocalStorage } from '../context/context';
import { appendToAuditLedger } from '../auditLedger.utils';

type EventType = 'Create' | 'Read' | 'Update' | 'Delete' | 'Error';

export async function logEvent(
    eventType: EventType,
    description: string,
    userId: number,
    tenant: string
): Promise<void> {
    const store = asyncLocalStorage.getStore();
    const effectiveUserId = store?.userId || userId;
    if (!effectiveUserId) {
        console.warn('No user ID found in context, skipping event log');
        return;
    }
    try {
        await sequelize.query(
            `INSERT INTO "${tenant}".event_logs (event_type, description, user_id) VALUES (:eventType, :description, :userId)`,
            {
                replacements: { eventType, description, userId: effectiveUserId },
                type: QueryTypes.INSERT,
            }
        );
        // Append to tamper-proof audit ledger (fire-and-forget)
        appendToAuditLedger({
            tenantId: tenant,
            entryType: "event_log",
            userId: effectiveUserId,
            eventType,
            description,
        }).catch(err => console.error("[audit_ledger] write failed:", err));
    } catch (err) {
        console.error('Failed to log event:', err);
    }
}
