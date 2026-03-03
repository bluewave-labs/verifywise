import { createHash } from "crypto";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";

/** SHA-256 of 64 zeroes — the "genesis" previous hash for the first entry */
export const GENESIS_HASH = "0".repeat(64);

interface AuditLedgerEntry {
  tenantId: string;
  entryType: "event_log" | "change_history";
  userId: number;
  eventType?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  action?: string | null;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  description?: string | null;
}

interface AuditLedgerHashPayload {
  id: number;
  entry_type: string;
  user_id: number | null;
  occurred_at: string;
  event_type: string | null;
  entity_type: string | null;
  entity_id: number | null;
  action: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  prev_hash: string;
}

/**
 * Compute a deterministic SHA-256 hash for an audit ledger entry.
 * Keys are sorted alphabetically for canonical form.
 */
export function computeEntryHash(payload: AuditLedgerHashPayload): string {
  const sorted: Record<string, unknown> = {};
  const payloadRecord = payload as unknown as Record<string, unknown>;
  for (const key of Object.keys(payloadRecord).sort()) {
    sorted[key] = payloadRecord[key];
  }
  return createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
}

/**
 * Append an entry to the tenant's audit_ledger using a SERIALIZABLE transaction.
 *
 * Flow:
 * 1. Get the prev_hash from the last entry (or GENESIS_HASH)
 * 2. INSERT with entry_hash = 'pending' sentinel
 * 3. Compute the real hash using the assigned id
 * 4. UPDATE the sentinel to the real hash
 *
 * The append-only triggers allow only this specific sentinel→hash transition.
 */
export async function appendToAuditLedger(
  entry: AuditLedgerEntry
): Promise<void> {
  const tenant = entry.tenantId;

  if (!/^[A-Za-z0-9]{10}$/.test(tenant)) {
    throw new Error("Invalid tenant identifier for audit ledger");
  }

  const txn: Transaction = await sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    // Step 1: Get the previous hash
    const lastRows: any[] = await sequelize.query(
      `SELECT entry_hash FROM "${tenant}".audit_ledger ORDER BY id DESC LIMIT 1`,
      { type: QueryTypes.SELECT, transaction: txn }
    );
    const prevHash = lastRows.length > 0 ? lastRows[0].entry_hash : GENESIS_HASH;

    // Step 2: INSERT with sentinel hash
    const sentinel = "pending".padEnd(64, "0");
    const insertResult: any[] = await sequelize.query(
      `INSERT INTO "${tenant}".audit_ledger
       (entry_type, user_id, occurred_at, event_type, entity_type, entity_id,
        action, field_name, old_value, new_value, description, entry_hash, prev_hash)
       VALUES (:entry_type, :user_id, NOW(), :event_type, :entity_type, :entity_id,
        :action, :field_name, :old_value, :new_value, :description, :sentinel, :prev_hash)
       RETURNING id, occurred_at`,
      {
        replacements: {
          entry_type: entry.entryType,
          user_id: entry.userId,
          event_type: entry.eventType || null,
          entity_type: entry.entityType || null,
          entity_id: entry.entityId || null,
          action: entry.action || null,
          field_name: entry.fieldName || null,
          old_value: entry.oldValue || null,
          new_value: entry.newValue || null,
          description: entry.description || null,
          sentinel,
          prev_hash: prevHash,
        },
        type: QueryTypes.INSERT,
        transaction: txn,
      }
    );

    const inserted = insertResult[0] as any;
    const newId: number = inserted.id;
    const occurredAt: string = inserted.occurred_at;

    // Step 3: Compute the real hash
    const realHash = computeEntryHash({
      id: newId,
      entry_type: entry.entryType,
      user_id: entry.userId,
      occurred_at: occurredAt,
      event_type: entry.eventType || null,
      entity_type: entry.entityType || null,
      entity_id: entry.entityId || null,
      action: entry.action || null,
      field_name: entry.fieldName || null,
      old_value: entry.oldValue || null,
      new_value: entry.newValue || null,
      description: entry.description || null,
      prev_hash: prevHash,
    });

    // Step 4: UPDATE sentinel → real hash (trigger allows this one transition)
    await sequelize.query(
      `UPDATE "${tenant}".audit_ledger SET entry_hash = :realHash WHERE id = :id`,
      {
        replacements: { realHash, id: newId },
        transaction: txn,
      }
    );

    await txn.commit();
  } catch (error) {
    await txn.rollback();
    throw error;
  }
}

interface VerifyChainOptions {
  batchSize?: number;
}

interface VerifyChainResult {
  status: "intact" | "compromised" | "empty";
  totalEntries: number;
  brokenAtId?: number;
  expectedHash?: string;
  actualHash?: string;
}

/**
 * Walk the entire audit chain and recompute every hash.
 * Returns the first broken link if any.
 */
export async function verifyChain(
  tenantId: string,
  options?: VerifyChainOptions
): Promise<VerifyChainResult> {
  if (!/^[A-Za-z0-9]{10}$/.test(tenantId)) {
    throw new Error("Invalid tenant identifier");
  }

  const batchSize = options?.batchSize || 1000;
  let offset = 0;
  let prevHash = GENESIS_HASH;
  let totalEntries = 0;

  while (true) {
    const rows: any[] = await sequelize.query(
      `SELECT id, entry_type, user_id, occurred_at, event_type, entity_type,
              entity_id, action, field_name, old_value, new_value, description,
              entry_hash, prev_hash
       FROM "${tenantId}".audit_ledger
       ORDER BY id ASC
       LIMIT :batchSize OFFSET :offset`,
      {
        replacements: { batchSize, offset },
        type: QueryTypes.SELECT,
      }
    );

    if (rows.length === 0) break;

    for (const row of rows) {
      totalEntries++;

      // Verify prev_hash linkage
      if (row.prev_hash !== prevHash) {
        return {
          status: "compromised",
          totalEntries,
          brokenAtId: row.id,
          expectedHash: prevHash,
          actualHash: row.prev_hash,
        };
      }

      // Recompute hash from row data
      const expectedHash = computeEntryHash({
        id: row.id,
        entry_type: row.entry_type,
        user_id: row.user_id,
        occurred_at: row.occurred_at,
        event_type: row.event_type,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        action: row.action,
        field_name: row.field_name,
        old_value: row.old_value,
        new_value: row.new_value,
        description: row.description,
        prev_hash: row.prev_hash,
      });

      if (row.entry_hash !== expectedHash) {
        return {
          status: "compromised",
          totalEntries,
          brokenAtId: row.id,
          expectedHash,
          actualHash: row.entry_hash,
        };
      }

      prevHash = row.entry_hash;
    }

    offset += batchSize;
  }

  if (totalEntries === 0) {
    return { status: "empty", totalEntries: 0 };
  }

  return { status: "intact", totalEntries };
}
