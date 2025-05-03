
import { useState, useEffect, useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { mockShifts } from "@/utils/mockData";
import { toast } from "sonner";
import { 
  formatDatabaseShifts, 
  filterShiftsByRole, 
  synchronizeShifts,
  clearShiftsFromLocalStorage
} from "./utils/shiftDataUtils";

interface UseShiftsFetchProps {
  userId?: string;
  userRole?: string;
  isAuthenticated?: boolean;
}

export const useShiftsFetch = ({ userId, userRole, isAuthenticated }: UseShiftsFetchProps) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create a refreshShifts function that can be called on demand
  const refreshShifts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    
    try {
      // Clear local storage cache to ensure fresh data
      clearShiftsFromLocalStorage();
      
      console.log('Fetching shifts from database...');
      
      // Simple query to get all shifts
      const { data: dbShifts, error: dbError } = await supabase
        .from('shifts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (dbError) {
        console.error('Database error fetching shifts:', dbError);
        throw dbError;
      }
      
      // If we have shifts in the database, use those
      if (dbShifts && dbShifts.length > 0) {
        console.log('Using shifts from database:', dbShifts.length, 'shifts found');
        
        const formattedShifts = formatDatabaseShifts(dbShifts);
        
        // Filter shifts based on user role
        const filteredShifts = filterShiftsByRole(formattedShifts, userRole, userId);
        
        setShifts(filteredShifts);
        console.log('Shifts loaded from database:', filteredShifts.length);
      } else {
        console.log('No shifts in database, using empty array');
        setShifts([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      
      // Last resort: fall back to an empty array
      setShifts([]);
      
      // Show error toast
      toast.error("Failed to load shifts", {
        description: "Please try refreshing the page."
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userId, userRole]);

  // Load shifts based on user role
  useEffect(() => {
    refreshShifts();
  }, [refreshShifts]);

  // Set up a realtime listener for shifts table changes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Subscribe to real-time changes in the shifts table
    const shiftsChannel = supabase
      .channel('shifts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shifts' }, 
        (payload) => {
          console.log('Realtime update received for shifts:', payload);
          refreshShifts();
        }
      )
      .subscribe();
    
    // Cleanup on unmount
    return () => {
      supabase.removeChannel(shiftsChannel);
    };
  }, [isAuthenticated, refreshShifts]);

  return {
    shifts,
    loading,
    error,
    setShifts,
    refreshShifts
  };
};
