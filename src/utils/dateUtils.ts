/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * This prevents timezone shifts when converting dates
 * 
 * @param date - The Date object to format
 * @returns A string in YYYY-MM-DD format in local timezone
 */
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a YYYY-MM-DD date string as a local date (not UTC)
 * This prevents timezone shifts when parsing dates from the database
 * 
 * @param dateString - The date string in YYYY-MM-DD format
 * @returns A Date object representing the date in local timezone
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

