
/**
 * Format number as BHD currency
 * @param amount Amount to format
 * @returns Formatted string in BHD currency format
 */
export const formatBHD = (amount: number) => {
  return `BHD ${amount.toFixed(3)}`;
};
