
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Validates if the user has permission to delete shifts
 * @param userRole The role of the current user
 * @returns Boolean indicating if the user has permission
 */
export const validateDeletePermission = (userRole?: string): boolean => {
  if (userRole !== 'admin' && userRole !== 'company') {
    console.error('Permission denied: Only admin or company users can perform deletion');
    toast.error("Permission Denied", {
      description: "Only admin or company users can delete shifts"
    });
    return false;
  }
  
  return true;
};

export interface ShiftDeleteCheckResult {
  canDelete: boolean;
  reason?: string;
  hasAssignments: boolean;
  hasCompletedWork: boolean;
  assignmentCount: number;
  completedWorkCount: number;
}

/**
 * Checks if a shift can be safely deleted
 * A shift can only be deleted if it has no completed work history (time logs with check_out_time)
 * @param shiftId The ID of the shift to check
 * @returns Object with deletion status and details
 */
export const canDeleteShift = async (shiftId: string): Promise<ShiftDeleteCheckResult> => {
  try {
    // Check for shift assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('shift_assignments')
      .select('id')
      .eq('shift_id', shiftId);

    if (assignmentsError) {
      console.error('Error checking assignments:', assignmentsError);
      return {
        canDelete: false,
        reason: 'Failed to check shift assignments',
        hasAssignments: false,
        hasCompletedWork: false,
        assignmentCount: 0,
        completedWorkCount: 0
      };
    }

    const hasAssignments = assignments && assignments.length > 0;
    const assignmentCount = assignments?.length || 0;

    // Check for completed time logs (work sessions that have ended)
    const { data: completedTimeLogs, error: timeLogsError } = await supabase
      .from('time_logs')
      .select('id')
      .eq('shift_id', shiftId)
      .not('check_out_time', 'is', null);

    if (timeLogsError) {
      console.error('Error checking time logs:', timeLogsError);
      return {
        canDelete: false,
        reason: 'Failed to check work history',
        hasAssignments,
        hasCompletedWork: false,
        assignmentCount,
        completedWorkCount: 0
      };
    }

    const hasCompletedWork = completedTimeLogs && completedTimeLogs.length > 0;
    const completedWorkCount = completedTimeLogs?.length || 0;

    // Shift cannot be deleted if there's completed work
    if (hasCompletedWork) {
      return {
        canDelete: false,
        reason: `This shift has ${completedWorkCount} completed work session${completedWorkCount > 1 ? 's' : ''}. Cannot delete shifts with work history.`,
        hasAssignments,
        hasCompletedWork,
        assignmentCount,
        completedWorkCount
      };
    }

    // Shift can be deleted
    return {
      canDelete: true,
      hasAssignments,
      hasCompletedWork: false,
      assignmentCount,
      completedWorkCount: 0
    };

  } catch (error) {
    console.error('Error in canDeleteShift:', error);
    return {
      canDelete: false,
      reason: 'An error occurred while checking shift deletion eligibility',
      hasAssignments: false,
      hasCompletedWork: false,
      assignmentCount: 0,
      completedWorkCount: 0
    };
  }
};
