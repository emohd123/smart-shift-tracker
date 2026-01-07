/**
 * Utility functions to check for overlapping shifts
 */

export interface ShiftTimeRange {
  date: string; // YYYY-MM-DD format
  end_date?: string | null; // YYYY-MM-DD format (optional for single-day shifts)
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
}

export interface OverlappingShift {
  shift_id: string;
  title: string;
  date: string;
  end_date?: string | null;
  start_time: string;
  end_time: string;
}

/**
 * Check if two date ranges overlap
 */
function dateRangesOverlap(
  start1: string,
  end1: string | null | undefined,
  start2: string,
  end2: string | null | undefined
): boolean {
  const startDate1 = new Date(start1);
  const endDate1 = end1 ? new Date(end1) : startDate1;
  const startDate2 = new Date(start2);
  const endDate2 = end2 ? new Date(end2) : startDate2;

  // Two ranges overlap if: start1 <= end2 AND start2 <= end1
  return startDate1 <= endDate2 && startDate2 <= endDate1;
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert HH:mm to minutes for easier comparison
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  // Two time ranges overlap if: start1 < end2 AND start2 < end1
  return start1Min < end2Min && start2Min < end1Min;
}

/**
 * Check if two shifts overlap in time
 */
export function shiftsOverlap(shift1: ShiftTimeRange, shift2: ShiftTimeRange): boolean {
  // First check if date ranges overlap
  if (!dateRangesOverlap(shift1.date, shift1.end_date, shift2.date, shift2.end_date)) {
    return false;
  }

  // If date ranges overlap, check if time ranges overlap
  // For multi-day shifts, we need to check if times overlap on any overlapping day
  // For simplicity, we check if the time ranges overlap (assuming same day logic)
  return timeRangesOverlap(shift1.start_time, shift1.end_time, shift2.start_time, shift2.end_time);
}

/**
 * Find overlapping shifts for a given shift and promoter
 */
export async function findOverlappingShifts(
  shiftId: string,
  promoterId: string,
  shiftDate: string,
  shiftEndDate: string | null | undefined,
  shiftStartTime: string,
  shiftEndTime: string
): Promise<OverlappingShift[]> {
  const { supabase } = await import('@/integrations/supabase/client');

  // Get all shifts the promoter is assigned to (excluding the current shift)
  const { data: assignments, error: assignmentsError } = await supabase
    .from('shift_assignments')
    .select(`
      shift_id,
      shifts:shift_id (
        id,
        title,
        date,
        end_date,
        start_time,
        end_time,
        status
      )
    `)
    .eq('promoter_id', promoterId)
    .neq('shift_id', shiftId)
    .in('status', ['pending', 'accepted', 'assigned']); // Only check active assignments

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
    return [];
  }

  if (!assignments) return [];

  const currentShift: ShiftTimeRange = {
    date: shiftDate,
    end_date: shiftEndDate,
    start_time: shiftStartTime,
    end_time: shiftEndTime,
  };

  const overlapping: OverlappingShift[] = [];

  for (const assignment of assignments) {
    const shift = assignment.shifts as any;
    if (!shift) continue;

    // Skip cancelled or completed shifts
    if (shift.status === 'cancelled' || shift.status === 'completed') {
      continue;
    }

    const otherShift: ShiftTimeRange = {
      date: shift.date,
      end_date: shift.end_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
    };

    if (shiftsOverlap(currentShift, otherShift)) {
      overlapping.push({
        shift_id: shift.id,
        title: shift.title,
        date: shift.date,
        end_date: shift.end_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
      });
    }
  }

  return overlapping;
}

