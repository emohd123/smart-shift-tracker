/**
 * Payment Validation Utilities
 * Validates payment-related data before processing
 */

/**
 * Validates payment amount
 * @param amount - Payment amount to validate
 * @returns true if valid, false otherwise
 */
export function validatePaymentAmount(amount: number): boolean {
  return typeof amount === 'number' && !isNaN(amount) && amount > 0;
}

/**
 * Validates transaction reference
 * @param ref - Transaction reference string
 * @returns true if valid, false otherwise
 */
export function validateTransactionReference(ref: string): boolean {
  if (!ref || typeof ref !== 'string') return false;
  const trimmed = ref.trim();
  return trimmed.length > 0 && trimmed.length <= 100; // Reasonable length limit
}

/**
 * Checks if payment can be processed for an assignment
 * This is a client-side check - server-side validation should also be performed
 * @param assignmentId - Assignment ID to check
 * @returns Promise resolving to boolean indicating if payment can be processed
 */
export async function canProcessPayment(assignmentId: string): Promise<boolean> {
  // This would typically check:
  // - Assignment exists
  // - Has time logs
  // - Not already paid
  // - Shift allows payment
  // For now, return true - actual validation happens server-side
  return true;
}
