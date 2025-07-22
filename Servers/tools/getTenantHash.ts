import { createHash } from "crypto";

export const getTenantHash = (tenantId: number): string => {
  const hash = createHash('sha256').update(tenantId.toString()).digest('base64');
  return hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}
