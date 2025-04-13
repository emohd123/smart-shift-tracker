
import { useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { removeShiftFromLocalStorage } from "./utils/shiftDataUtils";

interface UseShiftsDeleteProps {
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  userRole?: string;
}

export const useShiftsDelete = ({ setShifts, setError, userRole }: UseShiftsDeleteProps) => {
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
        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting shift from database:', error);
          // Continue with local deletion even if database deletion fails
        } else {
          console.log("Shift deleted from database");
        }
      } else {
        console.log("Not a valid UUID, skipping database deletion for mock data:", id);
      }
      
      // Then remove the shift from the local state regardless of database success
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
        description: "The shift has been successfully deleted"
      });
      
    } catch (err) {
      console.error('Error deleting shift:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete shift'));
      toast.error("Failed to delete shift", {
        description: "Please try again"
      });
    }
  }, [userRole, setShifts, setError]);

  return {
    deleteShift
  };
};
