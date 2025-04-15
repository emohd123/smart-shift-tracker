
import { useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { clearShiftsFromLocalStorage } from "./utils/shiftDataUtils";

interface UseShiftsDeleteProps {
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  userRole?: string;
  refreshShifts?: () => void;
}

export const useShiftsDelete = ({ setShifts, setError, userRole, refreshShifts }: UseShiftsDeleteProps) => {
  const deleteShift = useCallback(async (id: string) => {
    try {
      if (userRole !== 'admin') {
        toast.error("Permission Denied", {
          description: "Only admin users can delete shifts"
        });
        return;
      }
      
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isValidUUID) {
        const tables = ['shift_assignments', 'shift_locations', 'time_logs', 'notifications'];
        
        for (const table of tables) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq(table === 'notifications' ? 'related_id' : 'shift_id', id);
          
          if (error) {
            console.error(`Error deleting from ${table}:`, error);
          }
        }
        
        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting shift:', error);
          toast.error("Failed to Delete Shift", {
            description: error.message
          });
          return;
        }
      }
      
      setShifts(prev => prev.filter(shift => shift.id !== id));
      clearShiftsFromLocalStorage();
      
      toast.success("Shift Deleted", {
        description: "The shift has been permanently deleted"
      });
      
      if (refreshShifts) refreshShifts();
    } catch (err) {
      console.error('Deletion error:', err);
      toast.error("Deletion Failed", {
        description: "Unable to delete the shift"
      });
    }
  }, [userRole, setShifts, refreshShifts]);

  const deleteAllShifts = useCallback(async () => {
    try {
      if (userRole !== 'admin') {
        toast.error("Permission Denied", {
          description: "Only admin users can delete all shifts"
        });
        return;
      }

      const tables = ['shift_assignments', 'shift_locations', 'time_logs', 'notifications', 'shifts'];
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', 'no-match-placeholder');
        
        if (error) {
          console.error(`Error clearing ${table}:`, error);
        }
      }
      
      setShifts([]);
      clearShiftsFromLocalStorage();
      
      toast.success("All Shifts Deleted", {
        description: "All shifts have been permanently removed"
      });
      
      if (refreshShifts) refreshShifts();
    } catch (err) {
      console.error('Bulk deletion error:', err);
      toast.error("Deletion Failed", {
        description: "Unable to delete all shifts"
      });
    }
  }, [userRole, setShifts, refreshShifts]);

  return {
    deleteShift,
    deleteAllShifts
  };
};
