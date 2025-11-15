
import { Shift } from "@/components/shifts/types/ShiftTypes";

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
      const hours = calculateShiftHours(shift.startTime, shift.endTime);
      return sum + (shift.payRate * hours);
    }, 0);
  
  // Calculate unpaid amount
  const unpaidAmount = shifts
    .filter(shift => shift.status === "completed" && shift.isPaid === false)
    .reduce((sum, shift) => {
      const hours = calculateShiftHours(shift.startTime, shift.endTime);
      return sum + (shift.payRate * hours);
    }, 0);
  
  // Count of completed shifts (not the actual shifts array)
  const completedShifts = shifts.filter(shift => shift.status === "completed").length;

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
