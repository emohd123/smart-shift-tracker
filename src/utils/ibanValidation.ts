/**
 * IBAN Validation Utility
 * Validates and formats International Bank Account Numbers (IBAN)
 */

export interface IBANValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates IBAN format
 * @param iban - IBAN string to validate
 * @returns Validation result with error message if invalid
 */
export function validateIBAN(iban: string): IBANValidationResult {
  if (!iban || typeof iban !== 'string') {
    return { valid: false, error: 'IBAN is required' };
  }

  // Remove spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Check length (IBAN is 15-34 characters)
  if (cleaned.length < 15 || cleaned.length > 34) {
    return { 
      valid: false, 
      error: 'IBAN must be between 15 and 34 characters' 
    };
  }

  // Check format: 2 letters (country code), 2 digits (check digits), then alphanumeric
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
  if (!ibanRegex.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Invalid IBAN format. Must start with 2 letters, then 2 digits, followed by alphanumeric characters' 
    };
  }

  return { valid: true };
}

/**
 * Formats IBAN with spaces every 4 characters for readability
 * @param iban - IBAN string to format
 * @returns Formatted IBAN string
 * @example
 * formatIBAN("BH02CITI00001077181611")
 * // Returns: "BH02 CITI 0000 1077 1816 11"
 */
export function formatIBAN(iban: string): string {
  if (!iban) return '';
  
  // Remove existing spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  
  // Format with spaces every 4 characters
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
}

/**
 * Cleans IBAN by removing spaces and converting to uppercase
 * @param iban - IBAN string to clean
 * @returns Cleaned IBAN string
 */
export function cleanIBAN(iban: string): string {
  if (!iban) return '';
  return iban.replace(/\s/g, '').toUpperCase();
}
