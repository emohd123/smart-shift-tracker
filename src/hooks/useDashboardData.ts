
import { Shift } from "@/components/shifts/types/ShiftTypes";

/**
 * Custom hook to process dashboard data
 */
export function useDashboardData(shifts: Shift[]) {
  // Get upcoming shifts
  const upcomingShifts = shifts.filter(shift => shift.status === "upcoming").slice(0, 3);
  
  // Get next shift
  const nextShift = upcomingShifts[0];
  
  // Get current shift
  const currentShift = shifts.find(shift => shift.status === "ongoing") || null;
  
  // Calculate earnings
  const totalEarned = shifts
    .filter(shift => shift.status === "completed")
    .reduce((sum, shift) => {
      // Assuming 8 hour shifts for simplicity
      const hours = 8;
      return sum + (shift.payRate * hours);
    }, 0);
  
  // Calculate unpaid amount
  const unpaidAmount = shifts
    .filter(shift => shift.status === "completed" && shift.isPaid === false)
    .reduce((sum, shift) => {
      // Assuming 8 hour shifts for simplicity
      const hours = 8;
      return sum + (shift.payRate * hours);
    }, 0);
  
  // Count of completed shifts (not the actual shifts array)
  const completedShifts = shifts.filter(shift => shift.status === "completed").length;

  // Adding mock loading and error states
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
