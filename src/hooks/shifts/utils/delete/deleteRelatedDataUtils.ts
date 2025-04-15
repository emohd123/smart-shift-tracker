
import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes related data from shift_assignments table for a specific shift
 * @param shiftId ID of the shift to delete assignments for
 * @returns Object containing success status and any error
 */
export const deleteShiftAssignments = async (shiftId: string): Promise<{success: boolean; error?: any}> => {
  console.log(`[DELETE] Starting to delete assignments for shift ${shiftId}`);
  try {
    const { error, count } = await supabase
      .from('shift_assignments')
      .delete()
      .eq('shift_id', shiftId)
      .select('count');
    
    if (error) {
      console.error(`[DELETE ERROR] Failed to delete from shift_assignments:`, error);
      return { success: false, error };
    }
    
    console.log(`[DELETE SUCCESS] Removed ${count || 0} assignment records for shift ${shiftId}`);
    return { success: true };
  } catch (err) {
    console.error(`[DELETE ERROR] Unexpected error in assignment deletion for shift ${shiftId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Deletes related data from shift_locations table for a specific shift
 * @param shiftId ID of the shift to delete locations for
 * @returns Object containing success status and any error
 */
export const deleteShiftLocations = async (shiftId: string): Promise<{success: boolean; error?: any}> => {
  console.log(`[DELETE] Starting to delete locations for shift ${shiftId}`);
  try {
    const { error, count } = await supabase
      .from('shift_locations')
      .delete()
      .eq('shift_id', shiftId)
      .select('count');
    
    if (error) {
      console.error(`[DELETE ERROR] Failed to delete from shift_locations:`, error);
      return { success: false, error };
    }
    
    console.log(`[DELETE SUCCESS] Removed ${count || 0} location records for shift ${shiftId}`);
    return { success: true };
  } catch (err) {
    console.error(`[DELETE ERROR] Unexpected error in locations deletion for shift ${shiftId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Deletes related data from time_logs table for a specific shift
 * @param shiftId ID of the shift to delete time logs for
 * @returns Object containing success status and any error
 */
export const deleteShiftTimeLogs = async (shiftId: string): Promise<{success: boolean; error?: any}> => {
  console.log(`[DELETE] Starting to delete time logs for shift ${shiftId}`);
  try {
    const { error, count } = await supabase
      .from('time_logs')
      .delete()
      .eq('shift_id', shiftId)
      .select('count');
    
    if (error) {
      console.error(`[DELETE ERROR] Failed to delete from time_logs:`, error);
      return { success: false, error };
    }
    
    console.log(`[DELETE SUCCESS] Removed ${count || 0} time log records for shift ${shiftId}`);
    return { success: true };
  } catch (err) {
    console.error(`[DELETE ERROR] Unexpected error in time logs deletion for shift ${shiftId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Deletes related data from notifications table for a specific shift
 * @param shiftId ID of the shift to delete notifications for
 * @returns Object containing success status and any error
 */
export const deleteShiftNotifications = async (shiftId: string): Promise<{success: boolean; error?: any}> => {
  console.log(`[DELETE] Starting to delete notifications for shift ${shiftId}`);
  try {
    const { error, count } = await supabase
      .from('notifications')
      .delete()
      .eq('related_id', shiftId)
      .select('count');
    
    if (error) {
      console.error(`[DELETE ERROR] Failed to delete from notifications:`, error);
      return { success: false, error };
    }
    
    console.log(`[DELETE SUCCESS] Removed ${count || 0} notification records for shift ${shiftId}`);
    return { success: true };
  } catch (err) {
    console.error(`[DELETE ERROR] Unexpected error in notifications deletion for shift ${shiftId}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Deletes the main shift record from the shifts table
 * @param shiftId ID of the shift to delete
 * @returns Object containing success status and any error
 */
export const deleteMainShiftRecord = async (shiftId: string): Promise<{success: boolean; error?: any}> => {
  console.log(`[DELETE] Starting to delete main shift record ${shiftId}`);
  try {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId);
    
    if (error) {
      console.error(`[DELETE ERROR] Failed to delete main shift record:`, error);
      return { success: false, error };
    }
    
    console.log(`[DELETE SUCCESS] Removed main shift record ${shiftId}`);
    return { success: true };
  } catch (err) {
    console.error(`[DELETE ERROR] Unexpected error in deleting main shift ${shiftId}:`, err);
    return { success: false, error: err };
  }
};
