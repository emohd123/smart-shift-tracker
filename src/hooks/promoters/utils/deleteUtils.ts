
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Delete a single promoter from the database
 * @param promoterId ID of the promoter to delete
 * @returns Boolean indicating if deletion was successful
 */
export const deletePromoterFromDatabase = async (promoterId: string): Promise<boolean> => {
  try {
    // First delete related data
    await deletePromoterRelatedData(promoterId);
    
    // Then delete the promoter profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', promoterId);
    
    if (error) {
      console.error('Error deleting promoter:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Promoter deletion error:', err);
    return false;
  }
};

/**
 * Delete related data for a promoter (documents, shift assignments, etc.)
 * @param promoterId ID of the promoter
 */
const deletePromoterRelatedData = async (promoterId: string): Promise<void> => {
  try {
    // Delete documents
    type DeleteResult = { error: any };
    const { error: documentsError }: DeleteResult = await supabase
      .from('documents')
      .delete()
      .eq('user_id', promoterId);
      
    if (documentsError) {
      console.error('Error deleting promoter documents:', documentsError);
    }
    
    // Delete shift assignments
    const { error: assignmentsError } = await supabase
      .from('shift_assignments')
      .delete()
      .eq('promoter_id', promoterId);
      
    if (assignmentsError) {
      console.error('Error deleting promoter shift assignments:', assignmentsError);
    }
    
    // Delete payouts
    const { error: payoutsError }: DeleteResult = await supabase
      .from('payouts')
      .delete()
      .eq('user_id', promoterId);
      
    if (payoutsError) {
      console.error('Error deleting promoter payouts:', payoutsError);
    }
    
    // Delete time logs
    const { error: timeLogsError } = await supabase
      .from('time_logs')
      .delete()
      .eq('user_id', promoterId);
      
    if (timeLogsError) {
      console.error('Error deleting promoter time logs:', timeLogsError);
    }
    
    // Delete notifications
    const { error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', promoterId);
      
    if (notificationsError) {
      console.error('Error deleting promoter notifications:', notificationsError);
    }
    
  } catch (err) {
    console.error('Error deleting promoter related data:', err);
    throw err;
  }
};

/**
 * Delete all promoters from the database
 * @returns Boolean indicating if deletion was successful
 */
export const deleteAllPromotersFromDatabase = async (): Promise<boolean> => {
  try {
    // Fetch all promoter IDs first
    const { data: promoters, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'promoter');
    
    if (fetchError) {
      console.error('Error fetching promoters:', fetchError);
      return false;
    }
    
    if (!promoters || promoters.length === 0) {
      console.log('No promoters found to delete');
      return true; // No promoters to delete is still considered successful
    }
    
    console.log(`Found ${promoters.length} promoters to delete`);
    
    // Delete each promoter individually to handle related data
    const deletePromises = promoters.map(promoter => deletePromoterFromDatabase(promoter.id));
    const results = await Promise.all(deletePromises);
    
    // Check if all deletions were successful
    return results.every(result => result === true);
    
  } catch (err) {
    console.error('Error in bulk promoter deletion:', err);
    return false;
  }
};
