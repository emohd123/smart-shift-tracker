
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
    const { data: shifts, error: fetchError } = await supabase
      .from('shifts')
      .select('id');
    
    if (fetchError) {
      console.error('Error fetching shift IDs:', fetchError);
      toast.error("Database Error", {
        description: "Could not retrieve shifts to delete"
      });
      return false;
    }

    if (!shifts || shifts.length === 0) {
      console.log('No shifts found to delete');
      return true; // Nothing to delete is still a successful operation
    }

    console.log(`Found ${shifts.length} shifts to delete`);
    
    // Extract the shift IDs
    const shiftIds = shifts.map(s => s.id);
    
    // Process related tables one by one
    
    // Clear shift assignments - Delete each separately to avoid filter issues
    for (const shiftId of shiftIds) {
      try {
        const { error } = await supabase
          .from('shift_assignments')
          .delete()
          .eq('shift_id', shiftId);
        
        if (error) {
          console.error(`Error deleting assignments for shift ${shiftId}:`, error);
          hasErrors = true;
        }
      } catch (err) {
        console.error(`Error in assignment deletion for shift ${shiftId}:`, err);
        hasErrors = true;
      }
    }
    console.log('Completed shift assignments deletion process');
    
    // Clear shift locations - Delete each separately
    for (const shiftId of shiftIds) {
      try {
        const { error } = await supabase
          .from('shift_locations')
          .delete()
          .eq('shift_id', shiftId);
        
        if (error) {
          console.error(`Error deleting locations for shift ${shiftId}:`, error);
          hasErrors = true;
        }
      } catch (err) {
        console.error(`Error in locations deletion for shift ${shiftId}:`, err);
        hasErrors = true;
      }
    }
    console.log('Completed shift locations deletion process');
    
    // Clear time logs - Delete each separately
    for (const shiftId of shiftIds) {
      try {
        const { error } = await supabase
          .from('time_logs')
          .delete()
          .eq('shift_id', shiftId);
        
        if (error) {
          console.error(`Error deleting time logs for shift ${shiftId}:`, error);
          hasErrors = true;
        }
      } catch (err) {
        console.error(`Error in time logs deletion for shift ${shiftId}:`, err);
        hasErrors = true;
      }
    }
    console.log('Completed time logs deletion process');
    
    // Clear notifications related to shifts
    try {
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('type', 'shift');
      
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
    
    // Finally, delete each shift individually
    for (const shiftId of shiftIds) {
      try {
        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('id', shiftId);
        
        if (error) {
          console.error(`Error deleting shift ${shiftId}:`, error);
          hasErrors = true;
        }
      } catch (err) {
        console.error(`Error deleting shift ${shiftId}:`, err);
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
