/**
 * @fileoverview Deadline Analytics Repository
 *
 * Repository layer for deadline analytics API operations.
 * Follows the project's repository pattern for React Query integration.
 *
 * @module repository/deadlineAnalytics.repository
 */

import { fetchDeadlineAnalytics, clearDeadlineCache } from '../../infrastructure/api/deadlineService';
import { DeadlineAnalytics } from '../../presentation/components/DeadlineWarningBox/types';

/**
 * Fetch deadline analytics data
 */
export async function getDeadlineAnalytics(options?: {
  useCache?: boolean;
  signal?: AbortSignal;
}): Promise<{ data: DeadlineAnalytics }> {
  const analytics = await fetchDeadlineAnalytics(options);
  return { data: analytics };
}

/**
 * Clear deadline analytics cache
 */
export async function clearDeadlineAnalyticsCache(): Promise<void> {
  clearDeadlineCache();
}