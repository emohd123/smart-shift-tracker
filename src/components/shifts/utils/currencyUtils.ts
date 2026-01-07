// Currency mapping by nationality/country
export const currencyMap: Record<string, { code: string; symbol: string; decimals: number }> = {
  'Bahraini': { code: 'BHD', symbol: 'BHD', decimals: 3 },
  'Bahrain': { code: 'BHD', symbol: 'BHD', decimals: 3 },
  'BH': { code: 'BHD', symbol: 'BHD', decimals: 3 },
  'American': { code: 'USD', symbol: '$', decimals: 2 },
  'United States': { code: 'USD', symbol: '$', decimals: 2 },
  'US': { code: 'USD', symbol: '$', decimals: 2 },
  'British': { code: 'GBP', symbol: '£', decimals: 2 },
  'UAE': { code: 'AED', symbol: 'AED', decimals: 2 },
  'Emirati': { code: 'AED', symbol: 'AED', decimals: 2 },
  'Saudi': { code: 'SAR', symbol: 'SAR', decimals: 2 },
  'Saudi Arabian': { code: 'SAR', symbol: 'SAR', decimals: 2 },
  'Kuwaiti': { code: 'KWD', symbol: 'KWD', decimals: 3 },
  'Kuwait': { code: 'KWD', symbol: 'KWD', decimals: 3 },
  'Qatari': { code: 'QAR', symbol: 'QAR', decimals: 2 },
  'Qatar': { code: 'QAR', symbol: 'QAR', decimals: 2 },
  'Omani': { code: 'OMR', symbol: 'OMR', decimals: 3 },
  'Oman': { code: 'OMR', symbol: 'OMR', decimals: 3 },
  // Default fallback
  'default': { code: 'BHD', symbol: 'BHD', decimals: 3 }
};

/**
 * Get currency configuration based on nationality
 */
export const getCurrency = (nationality?: string | null) => {
  if (!nationality) return currencyMap['default'];
  return currencyMap[nationality] || currencyMap['default'];
};

/**
 * Format amount with currency based on nationality
 */
export const formatCurrency = (amount: number, nationality?: string | null) => {
  const currency = getCurrency(nationality);
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `${currency.symbol} ${safeAmount.toFixed(currency.decimals)}`;
};

/**
 * Format number as BHD currency (backward compatibility)
 * @param amount Amount to format
 * @returns Formatted string in BHD currency format
 */
export const formatBHD = (amount: number) => {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `BHD ${safeAmount.toFixed(3)}`;
};
