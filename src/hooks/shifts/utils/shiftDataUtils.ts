
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { ShiftStatus } from "@/types/database";

/**
 * Format database shifts to match our frontend Shift type
 */
export const formatDatabaseShifts = (dbShifts: any[]): Shift[] => {
  return dbShifts.map(shift => ({
    id: shift.id,
    title: shift.title,
    date: shift.date,
    endDate: shift.end_date,
    startTime: shift.start_time,
    endTime: shift.end_time,
    location: shift.location,
    status: shift.status as ShiftStatus,
    payRate: shift.pay_rate || 0,
    payRateType: shift.pay_rate_type || 'hour',
    isPaid: shift.is_paid || false,
    is_assigned: shift.is_assigned || false,
    assigned_promoters: shift.assigned_promoters || 0,
    created_at: shift.created_at
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
    pay_rate: shift.payRate || null,
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
        // Check if this shift already exists
        const existingShiftIndex = parsedShifts.findIndex((s: Shift) => s.id === shift.id);
        
        if (existingShiftIndex >= 0) {
          // Replace existing shift
          parsedShifts[existingShiftIndex] = shift;
          newSavedShifts = parsedShifts;
        } else {
          // Add new shift to the beginning
          newSavedShifts = [shift, ...parsedShifts];
        }
      } catch (e) {
        console.error('Error parsing saved shifts:', e);
      }
    }
    
    localStorage.setItem('shifts', JSON.stringify(newSavedShifts));
    console.log('Shift saved to localStorage:', shift.id);
  } catch (e) {
    console.error('Error saving shift to localStorage:', e);
  }
};

/**
 * Filter shifts based on user role
 */
export const filterShiftsByRole = (shifts: Shift[], userRole?: string, userId?: string): Shift[] => {
  if (!userRole) return [];
  
  // If admin, show all shifts
  if (userRole === 'admin') return shifts;
  
  // For promoters, we would filter based on assignments
  // This would require a join with shift_assignments in a real API
  // For now, we just return all shifts for the promoter
  return shifts;
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
      
      if (updatedShifts.length !== parsedShifts.length) {
        localStorage.setItem('shifts', JSON.stringify(updatedShifts));
        console.log('Shift removed from localStorage:', shiftId);
      }
    }
  } catch (e) {
    console.error('Error removing shift from localStorage:', e);
  }
};

/**
 * Synchronize local shifts with database shifts
 * This resolves conflicts by preferring database data
 */
export const synchronizeShifts = (localShifts: Shift[], dbShifts: Shift[]): Shift[] => {
  // Create a map of all database shifts by ID
  const dbShiftsMap = new Map(dbShifts.map(shift => [shift.id, shift]));
  
  // Filter local shifts to only include those not in the database
  const uniqueLocalShifts = localShifts.filter(shift => !dbShiftsMap.has(shift.id));
  
  // Combine database shifts with unique local shifts
  return [...dbShifts, ...uniqueLocalShifts];
};
