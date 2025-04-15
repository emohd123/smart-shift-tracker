
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    if (userRole !== 'admin') {
      return false;
    }

    // Delete from shift_assignments
    const { error: assignmentsError } = await supabase
      .from('shift_assignments')
      .delete()
      .neq('id', 'no-match-placeholder');
    
    if (assignmentsError) {
      console.error('Error clearing shift_assignments:', assignmentsError);
    }
    
    // Delete from shift_locations
    const { error: locationsError } = await supabase
      .from('shift_locations')
      .delete()
      .neq('id', 'no-match-placeholder');
    
    if (locationsError) {
      console.error('Error clearing shift_locations:', locationsError);
    }
    
    // Delete from time_logs
    const { error: timeLogsError } = await supabase
      .from('time_logs')
      .delete()
      .neq('id', 'no-match-placeholder');
    
    if (timeLogsError) {
      console.error('Error clearing time_logs:', timeLogsError);
    }
    
    // Delete from notifications related to shifts
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'shift');
    
    if (notificationsError) {
      console.error('Error clearing notifications:', notificationsError);
    }
    
    // Delete all shifts
    const { error: shiftsError } = await supabase
      .from('shifts')
      .delete()
      .neq('id', 'no-match-placeholder');
    
    if (shiftsError) {
      console.error('Error clearing shifts:', shiftsError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Bulk deletion error:', err);
    return false;
  }
};
