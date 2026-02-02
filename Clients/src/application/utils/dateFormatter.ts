import { formatDistanceToNow, isValid } from "date-fns";

/**
 * Format a date string to a human-readable relative time format
 * Uses date-fns for consistent, localized relative time formatting
 * @param dateString - ISO date string or date-parseable string
 * @returns Formatted date string (e.g., "5 minutes ago", "about 2 hours ago", "3 days ago")
 */
export const formatRelativeDate = (dateString: string): string => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  if (!isValid(date)) return "Unknown";

  return formatDistanceToNow(date, { addSuffix: true });
};
