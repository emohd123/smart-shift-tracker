
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { ShiftStatus } from "@/types/database";

/**
 * Format database shifts to match our frontend Shift type
 */
export const formatDatabaseShifts = (dbShifts: any[]): Shift[] => {
  return dbShifts.map(shift => ({
    ...shift,
    id: shift.id,
    date: shift.date,
    endDate: shift.end_date,
    startTime: shift.start_time,
    endTime: shift.end_time,
    payRate: shift.pay_rate,
    status: shift.status as ShiftStatus,
    isPaid: shift.is_paid
  }));
};

/**
 * Format a frontend Shift to match database schema
 */
export const formatShiftForDatabase = (shift: Shift) => {
  return {
    id: shift.id,
    title: shift.title,
    date: shift.date,
    end_date: shift.endDate,
    start_time: shift.startTime,
    end_time: shift.endTime,
    location: shift.location,
    status: shift.status,
    pay_rate: shift.payRate,
    pay_rate_type: shift.payRateType || 'hour',
    is_paid: shift.isPaid || false
  };
};

/**
 * Save shifts to localStorage (fallback storage)
 */
export const saveShiftsToLocalStorage = (shift: Shift): void => {
  try {
    const savedShifts = localStorage.getItem('shifts');
    let newSavedShifts = [shift];
    
    if (savedShifts) {
      try {
        const parsedShifts = JSON.parse(savedShifts);
        newSavedShifts = [shift, ...parsedShifts];
      } catch (e) {
        console.error('Error parsing saved shifts:', e);
      }
    }
    
    localStorage.setItem('shifts', JSON.stringify(newSavedShifts));
  } catch (e) {
    console.error('Error saving shift to localStorage:', e);
  }
};

/**
 * Filter shifts based on user role
 */
export const filterShiftsByRole = (shifts: Shift[], userRole?: string, userId?: string): Shift[] => {
  // If admin, show all shifts, otherwise filter for the specific user
  return userRole === 'admin' ? shifts : shifts;
};

/**
 * Remove shift from localStorage
 */
export const removeShiftFromLocalStorage = (shiftId: string): void => {
  try {
    const savedShifts = localStorage.getItem('shifts');
    if (savedShifts) {
      const parsedShifts = JSON.parse(savedShifts);
      const updatedShifts = parsedShifts.filter((shift: Shift) => shift.id !== shiftId);
      localStorage.setItem('shifts', JSON.stringify(updatedShifts));
    }
  } catch (e) {
    console.error('Error removing shift from localStorage:', e);
  }
};
