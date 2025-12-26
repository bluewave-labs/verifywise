/**
 * Date and compliance-related helper functions for Entity Graph
 */

/**
 * Calculate deadline status from a date string
 * Returns status (overdue/upcoming/normal) and days until deadline
 */
export function getDeadlineStatus(dateStr?: string): { status: 'overdue' | 'upcoming' | 'normal'; daysUntil: number } | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return { status: 'overdue', daysUntil: Math.abs(daysUntil) };
  if (daysUntil <= 14) return { status: 'upcoming', daysUntil };
  return { status: 'normal', daysUntil };
}

/**
 * Calculate evidence freshness from last upload date
 * Returns 'fresh' (<=30 days), 'stale' (31-90 days), or 'expired' (>90 days)
 */
export function getEvidenceFreshness(dateStr?: string): 'fresh' | 'stale' | 'expired' | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysSince <= 30) return 'fresh';
  if (daysSince <= 90) return 'stale';
  return 'expired';
}

/**
 * Derive vendor tier from risk level or review status
 * Returns 1 (high risk), 2 (medium risk), or 3 (low risk)
 */
export function getVendorTier(vendor: { risk_level?: string; review_status?: string }): 1 | 2 | 3 {
  const riskLevel = vendor.risk_level?.toLowerCase() || '';
  if (riskLevel.includes('critical') || riskLevel.includes('high')) return 1;
  if (riskLevel.includes('medium')) return 2;
  return 3;
}

/**
 * Calculate days since creation
 */
export function getDaysSinceCreation(createdAt?: string): number | undefined {
  if (!createdAt) return undefined;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}
