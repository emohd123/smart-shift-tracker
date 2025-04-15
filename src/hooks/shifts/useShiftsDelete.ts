
import { useCallback, useState } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { toast } from "sonner";
import { clearShiftsFromLocalStorage } from "./utils/shiftDataUtils";
import { deleteShiftDataFromDatabase, deleteAllShiftsFromDatabase } from "./utils/shiftDeleteUtils";

interface UseShiftsDeleteProps {
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  userRole?: string;
  refreshShifts?: () => void;
}

export const useShiftsDelete = ({ setShifts, setError, userRole, refreshShifts }: UseShiftsDeleteProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteShift = useCallback(async (id: string) => {
    // Prevent multiple deletion operations at once
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      if (userRole !== 'admin') {
        toast.error("Permission Denied", {
          description: "Only admin users can delete shifts"
        });
        return;
      }
      
      // Use the utility function to delete from database
      const success = await deleteShiftDataFromDatabase(id);
      
      if (!success) {
        toast.error("Failed to Delete Shift", {
          description: "Error removing the shift from the database"
        });
        return;
      }
      
      // Update client state
      setShifts(prev => prev.filter(shift => shift.id !== id));
      clearShiftsFromLocalStorage();
      
      toast.success("Shift Deleted", {
        description: "The shift has been permanently deleted"
      });
      
      // Refresh shifts if the function is provided
      if (refreshShifts) refreshShifts();
    } catch (err) {
      console.error('Deletion error:', err);
      setError(err instanceof Error ? err : new Error('Unknown deletion error'));
      toast.error("Deletion Failed", {
        description: "Unable to delete the shift"
      });
    } finally {
      setIsDeleting(false);
    }
  }, [userRole, setShifts, refreshShifts, setError, isDeleting]);

  const deleteAllShifts = useCallback(async () => {
    // Prevent multiple deletion operations at once
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      if (userRole !== 'admin') {
        toast.error("Permission Denied", {
          description: "Only admin users can delete all shifts"
        });
        return;
      }

      // Use the utility function to delete all shifts from database
      const success = await deleteAllShiftsFromDatabase(userRole);
      
      if (!success) {
        toast.error("Failed to Delete All Shifts", {
          description: "Error removing shifts from the database"
        });
        return;
      }
      
      // Update client state
      setShifts([]);
      clearShiftsFromLocalStorage();
      
      toast.success("All Shifts Deleted", {
        description: "All shifts have been permanently removed"
      });
      
      // Refresh shifts if the function is provided
      if (refreshShifts) refreshShifts();
    } catch (err) {
      console.error('Bulk deletion error:', err);
      setError(err instanceof Error ? err : new Error('Unknown bulk deletion error'));
      toast.error("Deletion Failed", {
        description: "Unable to delete all shifts"
      });
    } finally {
      setIsDeleting(false);
    }
  }, [userRole, setShifts, refreshShifts, setError, isDeleting]);

  return {
    deleteShift,
    deleteAllShifts,
    isDeleting
  };
};
