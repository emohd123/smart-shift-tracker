
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
    // Check user permissions
    if (userRole !== 'admin') {
      console.error('Permission denied: Only admin users can perform bulk deletion');
      toast.error("Permission Denied", {
        description: "Only admin users can delete all shifts"
      });
      return false;
    }

    let hasErrors = false;
    
    // First fetch all shift IDs to ensure we have proper references for related deletions
    const { data: shiftIds, error: fetchError } = await supabase
      .from('shifts')
      .select('id');
    
    if (fetchError) {
      console.error('Error fetching shift IDs:', fetchError);
      toast.error("Database Error", {
        description: "Could not retrieve shifts to delete"
      });
      return false;
    }

    console.log(`Found ${shiftIds?.length || 0} shifts to delete`);
    
    // Clear shift assignments
    try {
      const { error: assignmentsError } = await supabase
        .from('shift_assignments')
        .delete()
        .filter('shift_id', 'in', shiftIds?.map(s => s.id) || []);
      
      if (assignmentsError) {
        console.error('Error clearing shift_assignments:', assignmentsError);
        hasErrors = true;
      } else {
        console.log('Successfully deleted shift assignments');
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
        .filter('shift_id', 'in', shiftIds?.map(s => s.id) || []);
      
      if (locationsError) {
        console.error('Error clearing shift_locations:', locationsError);
        hasErrors = true;
      } else {
        console.log('Successfully deleted shift locations');
      }
    } catch (err) {
      console.error('Error in shift_locations deletion:', err);
      hasErrors = true;
    }
    
    // Clear time logs related to shifts
    try {
      const { error: timeLogsError } = await supabase
        .from('time_logs')
        .delete()
        .filter('shift_id', 'in', shiftIds?.map(s => s.id) || []);
      
      if (timeLogsError) {
        console.error('Error clearing time_logs:', timeLogsError);
        hasErrors = true;
      } else {
        console.log('Successfully deleted time logs');
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
        .filter('type', 'eq', 'shift');
      
      if (notificationsError) {
        console.error('Error clearing notifications:', notificationsError);
        hasErrors = true;
      } else {
        console.log('Successfully deleted shift notifications');
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
      } else {
        console.log('Successfully deleted all shifts');
        
        // Clear local storage cache of shifts as well
        localStorage.removeItem('shifts');
        console.log('Cleared shifts from local storage');
      }
    } catch (err) {
      console.error('Error in shifts deletion:', err);
      hasErrors = true;
    }
    
    // Return success if there were no errors
    return !hasErrors;
  } catch (err) {
    console.error('Bulk deletion error:', err);
    return false;
  }
};
