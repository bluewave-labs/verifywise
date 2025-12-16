/**
 * @fileoverview Deadline Analytics Repository
 *
 * Repository layer for deadline analytics API operations.
 * Follows the project's repository pattern for React Query integration.
 *
 * @module repository/deadlineAnalytics.repository
 */

import { deadlineAPI } from '../../infrastructure/api/deadlineService';
import { DeadlineSummary } from '../../presentation/components/DeadlineWarningBox/types';

/**
 * Fetch deadline analytics data
 */
export async function getDeadlineAnalytics(
  entityType: "tasks" | "vendors" | "policies" | "risks"
): Promise<{ data: DeadlineSummary }> {
  const analytics = await deadlineAPI.getSummary(entityType);
  return { data: analytics };
}

/**
 * Clear deadline analytics cache
 */
export async function clearDeadlineAnalyticsCache(): Promise<void> {
  // Note: deadlineAPI doesn't have a clear cache method yet
  // This can be implemented when needed
  console.log('Clear deadline analytics cache - not implemented yet');
}