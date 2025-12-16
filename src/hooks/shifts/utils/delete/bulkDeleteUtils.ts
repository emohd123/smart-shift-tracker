
import { supabase } from "@/integrations/supabase/client";
import { validateDeletePermission } from "./deletePermissionUtils";

/**
 * Simpler approach to delete all shifts by directly removing from the shifts table
 * @param userRole The role of the current user
 * @returns Boolean indicating if the operation was successful
 */
export const deleteAllShiftsFromDatabase = async (userRole?: string): Promise<boolean> => {
  try {
    // Check user permissions
    if (!validateDeletePermission(userRole)) {
      console.error('Permission denied: Only admins can delete all shifts');
      return false;
    }



    // First try to get all shifts to see if there are any
    const { data: shifts } = await supabase
      .from('shifts')
      .select('id')
      .limit(1);

    if (!shifts || shifts.length === 0) {

      return true; // Nothing to delete is still successful
    }

    // Delete directly from the shifts table (simpler approach)
    const { error } = await supabase
      .from('shifts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
      console.error('Error in bulk delete operation:', error);
      return false;
    }



    // Clear any local storage data related to shifts
    localStorage.removeItem('shifts');


    return true;
  } catch (err) {
    console.error('Bulk deletion error:', err);
    return false;
  }
};

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

      return [];
    }

    return shifts.map(s => s.id);
  } catch (err) {
    console.error('Error fetching shift IDs:', err);
    return null;
  }
};
