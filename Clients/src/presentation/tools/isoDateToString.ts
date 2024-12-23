/**
 * Converts an ISO date string to a formatted date string.
 *
 * @param {string} isoDate - The ISO date string to be converted.
 * @returns {string} The formatted date string in the format "1 November 2024".
 */
export function formatDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}/.test(isoDate)) {
    throw new Error("Invalid ISO date format");
  }

  const date = new Date(isoDate);
  const day = date.getUTCDate();
  const month = date.toLocaleString("default", { month: "long", timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}
