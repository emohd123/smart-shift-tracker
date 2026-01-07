
import { useCallback, useState } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { toast } from "sonner";
import { clearShiftsFromLocalStorage } from "./utils/shiftDataUtils";
import { deleteShiftDataFromDatabase, deleteAllShiftsFromDatabase } from "./utils/delete";
import { canDeleteShift } from "./utils/delete/deletePermissionUtils";

interface UseShiftsDeleteProps {
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  userRole?: string;
  refreshShifts?: () => Promise<void>;
}

export const useShiftsDelete = ({ setShifts, setError, userRole, refreshShifts }: UseShiftsDeleteProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteShift = useCallback(async (id: string) => {
    // Prevent multiple deletion operations at once
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      // Allow admin and company users to delete shifts
      if (userRole !== 'admin' && userRole !== 'company') {
        toast.error("Permission Denied", {
          description: "Only admin or company users can delete shifts"
        });
        return;
      }
      
      // Check if shift can be deleted (no completed work history)
      const deleteCheck = await canDeleteShift(id);
      
      if (!deleteCheck.canDelete) {
        toast.error("Cannot Delete Shift", {
          description: deleteCheck.reason || "This shift cannot be deleted"
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
      
      toast.success("Shift Deleted", {
        description: "The shift has been permanently deleted"
      });
      
      // Refresh shifts if the function is provided to ensure UI is in sync with database
      if (refreshShifts) await refreshShifts();
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
    if (isDeleting) {
      toast.info("Deletion in Progress", {
        description: "Please wait for the current operation to complete"
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Only admin can delete all shifts (bulk delete is more dangerous)
      if (userRole !== 'admin') {
        toast.error("Permission Denied", {
          description: "Only admin users can delete all shifts"
        });
        return;
      }

      toast.info("Deleting All Shifts", {
        description: "This may take a moment..."
      });

      // Use the utility function to delete all shifts from database
      const success = await deleteAllShiftsFromDatabase(userRole);
      
      // Update client state regardless of success (we'll refresh after)
      setShifts([]);
      clearShiftsFromLocalStorage();
      
      if (!success) {
        toast.error("Deletion Error", {
          description: "Some shift data couldn't be removed completely."
        });
      } else {
        toast.success("All Shifts Deleted", {
          description: "All shifts have been permanently removed"
        });
      }
      
      // Always refresh shifts to ensure UI reflects the current database state
      if (refreshShifts) await refreshShifts();
    } catch (err) {
      console.error('Bulk deletion error:', err);
      setError(err instanceof Error ? err : new Error('Unknown bulk deletion error'));
      toast.error("Deletion Failed", {
        description: "Unable to delete all shifts. Please try again later."
      });
      
      // Always refresh to ensure we show the current state
      if (refreshShifts) await refreshShifts();
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
