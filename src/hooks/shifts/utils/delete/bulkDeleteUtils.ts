
import { supabase } from "@/integrations/supabase/client";
import { validateDeletePermission } from "./deletePermissionUtils";
import { 
  deleteShiftAssignments, 
  deleteShiftLocations, 
  deleteShiftTimeLogs, 
  deleteShiftNotifications,
  deleteMainShiftRecord
} from "./deleteRelatedDataUtils";

/**
 * Fetches all shift IDs from the database
 * @returns Array of shift IDs or null if fetch failed
 */
export const fetchAllShiftIds = async (): Promise<string[] | null> => {
  try {
    const { data: shifts, error: fetchError } = await supabase
      .from('shifts')
      .select('id');
    
    if (fetchError) {
      console.error('Error fetching shift IDs:', fetchError);
      return null;
    }

    if (!shifts || shifts.length === 0) {
      console.log('No shifts found to delete');
      return [];
    }

    return shifts.map(s => s.id);
  } catch (err) {
    console.error('Error fetching shift IDs:', err);
    return null;
  }
};

/**
 * Handle deletion of all shifts and their related data in the database
 * @param userRole The role of the current user
 * @returns Boolean indicating if the operation was successful
 */
export const deleteAllShiftsFromDatabase = async (userRole?: string): Promise<boolean> => {
  try {
    // Check user permissions
    if (!validateDeletePermission(userRole)) {
      return false;
    }

    // Fetch all shift IDs
    const shiftIds = await fetchAllShiftIds();
    
    if (shiftIds === null) {
      return false;
    }
    
    if (shiftIds.length === 0) {
      return true; // Nothing to delete is still successful
    }

    console.log(`Found ${shiftIds.length} shifts to delete`);
    
    let hasErrors = false;
    
    // Process each shift individually for deletion
    for (const shiftId of shiftIds) {
      // Delete related data in sequence
      const assignmentsResult = await deleteShiftAssignments(shiftId);
      const locationsResult = await deleteShiftLocations(shiftId);
      const timeLogsResult = await deleteShiftTimeLogs(shiftId);
      const notificationsResult = await deleteShiftNotifications(shiftId);
      
      // Only try to delete the shift if all related data was deleted or if we have errors but want to continue
      const shiftResult = await deleteMainShiftRecord(shiftId);
      
      // Update error status
      if (!assignmentsResult.success || !locationsResult.success || 
          !timeLogsResult.success || !notificationsResult.success || 
          !shiftResult.success) {
        hasErrors = true;
      }
    }
    
    console.log('Completed shifts deletion process');
    localStorage.removeItem('shifts');
    console.log('Cleared shifts from local storage');
    
    return !hasErrors;
  } catch (err) {
    console.error('Bulk deletion error:', err);
    return false;
  }
};
