
import { supabase } from "@/integrations/supabase/client";

// Handle deletion of related data for a specific shift
export const deleteShiftDataFromDatabase = async (shiftId: string): Promise<boolean> => {
  try {
    if (!shiftId) {
      console.error('No shift ID provided for deletion');
      return false;
    }
    
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shiftId);
    
    if (!isValidUUID) {
      console.error('Invalid UUID format for shift ID:', shiftId);
      return false;
    }

    // Delete related data from shift_assignments
    const { error: assignmentsError } = await supabase
      .from('shift_assignments')
      .delete()
      .eq('shift_id', shiftId);
    
    if (assignmentsError) {
      console.error('Error deleting from shift_assignments:', assignmentsError);
    }
    
    // Delete related data from shift_locations
    const { error: locationsError } = await supabase
      .from('shift_locations')
      .delete()
      .eq('shift_id', shiftId);
    
    if (locationsError) {
      console.error('Error deleting from shift_locations:', locationsError);
    }
    
    // Delete related data from time_logs
    const { error: timeLogsError } = await supabase
      .from('time_logs')
      .delete()
      .eq('shift_id', shiftId);
    
    if (timeLogsError) {
      console.error('Error deleting from time_logs:', timeLogsError);
    }
    
    // Delete related data from notifications
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('related_id', shiftId);
    
    if (notificationsError) {
      console.error('Error deleting from notifications:', notificationsError);
    }
    
    // Finally delete the shift itself
    const { error: shiftError } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId);
    
    if (shiftError) {
      console.error('Error deleting shift:', shiftError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Deletion error:', err);
    return false;
  }
};

// Handle deletion of all shifts data
export const deleteAllShiftsFromDatabase = async (userRole?: string): Promise<boolean> => {
  try {
    // Check user permissions
    if (userRole !== 'admin') {
      console.error('Permission denied: Only admin users can perform bulk deletion');
      return false;
    }

    let hasErrors = false;
    
    // Attempt to delete each related table in sequence
    // This approach tries each table independently so errors in one don't stop others
    
    // Clear shift assignments
    try {
      const { error: assignmentsError } = await supabase
        .from('shift_assignments')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (assignmentsError) {
        console.error('Error clearing shift_assignments:', assignmentsError);
        hasErrors = true;
      }
    } catch (err) {
      console.error('Error in shift_assignments deletion:', err);
      hasErrors = true;
    }
    
    // Clear shift locations
    try {
      const { error: locationsError } = await supabase
        .from('shift_locations')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (locationsError) {
        console.error('Error clearing shift_locations:', locationsError);
        hasErrors = true;
      }
    } catch (err) {
      console.error('Error in shift_locations deletion:', err);
      hasErrors = true;
    }
    
    // Clear time logs
    try {
      const { error: timeLogsError } = await supabase
        .from('time_logs')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (timeLogsError) {
        console.error('Error clearing time_logs:', timeLogsError);
        hasErrors = true;
      }
    } catch (err) {
      console.error('Error in time_logs deletion:', err);
      hasErrors = true;
    }
    
    // Clear notifications related to shifts
    try {
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('type', 'shift');
      
      if (notificationsError) {
        console.error('Error clearing notifications:', notificationsError);
        hasErrors = true;
      }
    } catch (err) {
      console.error('Error in notifications deletion:', err);
      hasErrors = true;
    }
    
    // Finally, clear all shifts
    try {
      const { error: shiftsError } = await supabase
        .from('shifts')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (shiftsError) {
        console.error('Error clearing shifts:', shiftsError);
        hasErrors = true;
      }
    } catch (err) {
      console.error('Error in shifts deletion:', err);
      hasErrors = true;
    }
    
    // Return success if at least one operation succeeded
    return !hasErrors;
  } catch (err) {
    console.error('Bulk deletion error:', err);
    return false;
  }
};
