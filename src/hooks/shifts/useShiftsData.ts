
import { useState } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { useShiftsFetch } from "./useShiftsFetch";
import { useShiftsAdd } from "./useShiftsAdd";
import { useShiftsDelete } from "./useShiftsDelete";

interface UseShiftsDataProps {
  userId?: string;
  userRole?: string;
  isAuthenticated?: boolean;
}

export const useShiftsData = ({ userId, userRole, isAuthenticated }: UseShiftsDataProps) => {
  const [error, setError] = useState<Error | null>(null);
  
  // Use the fetch hook to get shifts
  const { shifts, loading, setShifts, refreshShifts } = useShiftsFetch({ 
    userId, 
    userRole, 
    isAuthenticated 
  });
  
  // Use the add hook for adding shifts
  const { addShift } = useShiftsAdd({ setShifts });
  
  // Use the delete hook for deleting shifts
  const { deleteShift } = useShiftsDelete({ 
    setShifts, 
    setError, 
    userRole 
  });

  return {
    shifts,
    loading,
    error,
    deleteShift,
    addShift,
    refreshShifts
  };
};
