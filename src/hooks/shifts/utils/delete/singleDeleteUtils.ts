
import { validateDeletePermission } from "./deletePermissionUtils";
import { 
  deleteShiftAssignments, 
  deleteShiftLocations, 
  deleteShiftTimeLogs, 
  deleteShiftNotifications,
  deleteMainShiftRecord
} from "./deleteRelatedDataUtils";

/**
 * Validates if a shift ID is in the correct UUID format
 * @param shiftId ID to validate
 * @returns Boolean indicating if the ID is valid
 */
export const validateShiftId = (shiftId: string): boolean => {
  if (!shiftId) {
    console.error('No shift ID provided for deletion');
    return false;
  }
  
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shiftId);
  
  if (!isValidUUID) {
    console.error('Invalid UUID format for shift ID:', shiftId);
    return false;
  }
  
  return true;
};

/**
 * Handle deletion of a specific shift and its related data in the database
 * @param shiftId ID of the shift to delete
 * @returns Boolean indicating if the deletion was successful
 */
export const deleteShiftDataFromDatabase = async (shiftId: string): Promise<boolean> => {
  try {
    // Validate the shift ID
    if (!validateShiftId(shiftId)) {
      return false;
    }

    // Delete related data in sequence
    const assignmentsResult = await deleteShiftAssignments(shiftId);
    const locationsResult = await deleteShiftLocations(shiftId);
    const timeLogsResult = await deleteShiftTimeLogs(shiftId);
    const notificationsResult = await deleteShiftNotifications(shiftId);
    
    // Only try to delete the shift if all related data was deleted or if we have errors but want to continue
    const shiftResult = await deleteMainShiftRecord(shiftId);
    
    // Check if any operation failed
    if (!assignmentsResult.success || !locationsResult.success || 
        !timeLogsResult.success || !notificationsResult.success || 
        !shiftResult.success) {
      console.error('Some operations failed during shift deletion');
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Deletion error:', err);
    return false;
  }
};
