
import { useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatShiftForDatabase, saveShiftsToLocalStorage } from "./utils/shiftDataUtils";

interface UseShiftsAddProps {
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
}

export const useShiftsAdd = ({ setShifts }: UseShiftsAddProps) => {
  // Add a shift to the list
  const addShift = useCallback(async (shift: Shift) => {
    try {
      // First try to add to Supabase
      const { data, error } = await supabase
        .from('shifts')
        .insert(formatShiftForDatabase(shift))
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('Shift added to database:', data);
      
      // Then update local state
      setShifts(prev => [shift, ...prev]);
      
      // Save to localStorage as fallback
      saveShiftsToLocalStorage(shift);
      
      toast.success("Shift added successfully", {
        description: "The shift has been added to the database"
      });
    } catch (error) {
      console.error('Error adding shift:', error);
      toast.error("Failed to add shift to database", {
        description: "Saving locally only"
      });
      
      // If database save fails, at least update local state
      setShifts(prev => [shift, ...prev]);
    }
  }, [setShifts]);

  return {
    addShift
  };
};
