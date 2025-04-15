
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

    // Define the tables where we need to delete related data
    const tables = ['shift_assignments', 'shift_locations', 'time_logs', 'notifications'];
    
    // Delete related data from each table
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(table === 'notifications' ? 'related_id' : 'shift_id', shiftId);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
      }
    }
    
    // Finally delete the shift itself
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId);
    
    if (error) {
      console.error('Error deleting shift:', error);
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

    // Define the tables to clear in order (to avoid foreign key constraints)
    const tables = ['shift_assignments', 'shift_locations', 'time_logs', 'notifications', 'shifts'];
    
    // Clear all data from each table
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', 'no-match-placeholder');
      
      if (error) {
        console.error(`Error clearing ${table}:`, error);
      }
    }
    
    return true;
  } catch (err) {
    console.error('Bulk deletion error:', err);
    return false;
  }
};
