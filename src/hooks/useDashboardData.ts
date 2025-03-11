
import { Shift } from "@/components/shifts/ShiftCard";

/**
 * Custom hook to process dashboard data
 */
export function useDashboardData(shifts: Shift[]) {
  // Get upcoming shifts
  const upcomingShifts = shifts.filter(shift => shift.status === "upcoming").slice(0, 3);
  
  // Get next shift
  const nextShift = upcomingShifts[0];
  
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
  
  const completedShifts = shifts.filter(shift => shift.status === "completed").length;

  return {
    upcomingShifts,
    nextShift,
    totalEarned,
    unpaidAmount,
    completedShifts
  };
}
