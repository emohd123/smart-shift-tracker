
import { useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { removeShiftFromLocalStorage } from "./utils/shiftDataUtils";

interface UseShiftsDeleteProps {
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  userRole?: string;
  refreshShifts?: () => void; // Add refreshShifts parameter
}

export const useShiftsDelete = ({ setShifts, setError, userRole, refreshShifts }: UseShiftsDeleteProps) => {
  // Handle shift deletion
  const deleteShift = useCallback(async (id: string) => {
    try {
      console.log("Deleting shift with ID:", id);
      
      // Verify if user is admin before allowing deletion
      if (userRole !== 'admin') {
        toast.error("Permission Denied", {
          description: "Only admin users can delete shifts"
        });
        return;
      }
      
      // First try to delete from Supabase - only if it's a valid UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isValidUUID) {
        // Delete related data first to maintain referential integrity
        
        // 1. Delete shift assignments
        const { error: assignmentError } = await supabase
          .from('shift_assignments')
          .delete()
          .eq('shift_id', id);
          
        if (assignmentError) {
          console.error('Error deleting shift assignments:', assignmentError);
          // Continue with shift deletion even if assignment deletion fails
        } else {
          console.log('Successfully deleted related shift assignments');
        }
        
        // 2. Delete shift locations
        const { error: locationError } = await supabase
          .from('shift_locations')
          .delete()
          .eq('shift_id', id);
          
        if (locationError) {
          console.error('Error deleting shift location:', locationError);
          // Continue with shift deletion even if location deletion fails
        } else {
          console.log('Successfully deleted related shift locations');
        }
        
        // 3. Delete time logs if any exist
        const { error: timeLogError } = await supabase
          .from('time_logs')
          .delete()
          .eq('shift_id', id);
        
        if (timeLogError) {
          console.error('Error deleting related time logs:', timeLogError);
          // Continue with main deletion
        } else {
          console.log('Successfully deleted related time logs if any existed');
        }
        
        // 4. Delete notifications related to this shift
        const { error: notificationError } = await supabase
          .from('notifications')
          .delete()
          .eq('related_id', id)
          .eq('type', 'shift_assignment');
        
        if (notificationError) {
          console.error('Error deleting related notifications:', notificationError);
          // Continue with main deletion
        } else {
          console.log('Successfully deleted related notifications if any existed');
        }
        
        // 5. Finally delete the shift itself
        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting shift from database:', error);
          throw new Error(`Database error: ${error.message}`);
        } else {
          console.log(`Shift deleted from database successfully.`);
          
          // Add an explicit refresh after deletion is confirmed
          if (refreshShifts) {
            console.log('Refreshing shifts data after deletion');
            refreshShifts();
          }
        }
      } else {
        console.log("Not a valid UUID, skipping database deletion for mock data:", id);
      }
      
      // Remove from local state regardless of database success
      setShifts(prev => {
        console.log("Previous shifts count:", prev.length);
        const filtered = prev.filter(shift => shift.id !== id);
        console.log("Filtered shifts count:", filtered.length);
        console.log("Removed:", prev.length - filtered.length, "shifts");
        return filtered;
      });
      
      // Update localStorage if it exists there
      removeShiftFromLocalStorage(id);
      
      toast.success("Shift Deleted", {
        description: "The shift has been permanently deleted"
      });
      
    } catch (err) {
      console.error('Error deleting shift:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete shift'));
      toast.error("Failed to delete shift", {
        description: "Please try again"
      });
    }
  }, [userRole, setShifts, setError, refreshShifts]);

  return {
    deleteShift
  };
};
