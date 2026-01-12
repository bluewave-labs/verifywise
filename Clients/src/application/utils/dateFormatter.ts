/**
 * Format a date string to a human-readable relative time format
 * @param dateString - ISO date string or date-parseable string
 * @returns Formatted date string (e.g., "Today", "Yesterday", "3 days ago")
 */
export const formatRelativeDate = (dateString: string): string => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown";

  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return date.toLocaleDateString();
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

/**
 * Format a date string to a locale date string
 * @param dateString - ISO date string or date-parseable string
 * @returns Formatted locale date string
 */
export const formatLocaleDate = (dateString: string): string => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString();
};

/**
 * Format a date string to a locale date and time string
 * @param dateString - ISO date string or date-parseable string
 * @returns Formatted locale date and time string
 */
export const formatLocaleDateTime = (dateString: string): string => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString();
};
