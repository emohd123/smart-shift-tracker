
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
    created_at: shift.created_at,
    manual_status_override: shift.manual_status_override || false,
    override_status: shift.override_status || undefined,
    companyId: shift.company_id
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
    is_paid: shift.isPaid || false,
    manual_status_override: shift.manual_status_override || false,
    override_status: shift.override_status || null
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

  } catch (e) {
    console.error('Error saving shift to localStorage:', e);
  }
};

/**
 * Filter shifts based on user role
 * For promoters: Only return shifts they are assigned to (via shift_assignments table)
 * For admins: Return all shifts
 */
export const filterShiftsByRole = (shifts: Shift[], userRole?: string, userId?: string): Shift[] => {
  if (!userRole) return [];

  // If admin, show all shifts
  if (userRole === 'admin' || userRole === 'super_admin') return shifts;

  // For promoters, only show shifts they are assigned to
  // Note: This should be filtered by shift_assignments, but since we fetch all shifts first,
  // the filtering by assignments happens in the component via shift_assignments query
  // Return all shifts here; component will filter by assignments
  if (userRole === 'promoter') return shifts;

  // For company, return shifts (will be filtered by company_id in the query itself)
  if (userRole === 'company') return shifts;

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

      }
    }
  } catch (e) {
    console.error('Error removing shift from localStorage:', e);
  }
};

/**
 * Clear all shifts from localStorage
 */
export const clearShiftsFromLocalStorage = (): void => {
  try {
    localStorage.removeItem('shifts');

  } catch (e) {
    console.error('Error clearing shifts from localStorage:', e);
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
