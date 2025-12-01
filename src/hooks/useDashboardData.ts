
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { getEffectiveStatus } from "@/components/shifts/utils/statusCalculations";

/**
 * Calculate actual hours between start and end time
 */
function calculateShiftHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  let diffMinutes = endMinutes - startMinutes;
  if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight shifts
  
  return diffMinutes / 60;
}

/**
 * Custom hook to process dashboard data
 * @param shifts - Array of shifts
 * @param actualEarnings - Optional actual earnings from time_logs (prioritized over calculated)
 */
export function useDashboardData(shifts: Shift[], actualEarnings?: { total: number; unpaid: number }) {
  // Get upcoming shifts (considering manual override)
  const upcomingShifts = shifts.filter(shift => getEffectiveStatus(shift) === "upcoming").slice(0, 3);
  
  // Get next shift
  const nextShift = upcomingShifts[0];
  
  // Get current shift (considering manual override)
  const currentShift = shifts.find(shift => getEffectiveStatus(shift) === "ongoing") || null;
  
  // Calculate earnings (considering manual override)
  // Use actual earnings from time_logs if provided, otherwise calculate from shifts
  const totalEarned = actualEarnings?.total ?? shifts
    .filter(shift => getEffectiveStatus(shift) === "completed")
    .reduce((sum, shift) => {
      const hours = calculateShiftHours(shift.startTime, shift.endTime);
      return sum + ((shift.payRate || 0) * hours);
    }, 0);
  
  // Calculate unpaid amount (considering manual override)
  const unpaidAmount = actualEarnings?.unpaid ?? shifts
    .filter(shift => getEffectiveStatus(shift) === "completed" && shift.isPaid === false)
    .reduce((sum, shift) => {
      const hours = calculateShiftHours(shift.startTime, shift.endTime);
      return sum + ((shift.payRate || 0) * hours);
    }, 0);
  
  // Count of completed shifts (considering manual override)
  const completedShifts = shifts.filter(shift => getEffectiveStatus(shift) === "completed").length;

  const loading = false;
  const error = null;

  return {
    upcomingShifts,
    nextShift,
    currentShift,
    totalEarned,
    unpaidAmount,
    completedShifts,
    loading,
    error
  };
}

/**
 * Get approved shifts count for certificates
 */
export function useApprovedShiftsCount() {
  return 0; // Placeholder - will be fetched from shift_assignments in component
}
