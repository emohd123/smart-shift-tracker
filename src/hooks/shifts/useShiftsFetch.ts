import { useState, useEffect, useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { mockShifts } from "@/utils/mockData";
import { toast } from "sonner";
import { 
  formatDatabaseShifts, 
  filterShiftsByRole, 
  synchronizeShifts 
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
      // First check if we have actual shifts in the database
      const { data: dbShifts, error: dbError } = await supabase
        .from('shifts')
        .select('*, shift_assignments(promoter_id)')
        .order('created_at', { ascending: false });
      
      if (dbError) {
        console.error('Database error fetching shifts:', dbError);
        throw dbError;
      }
      
      // If we have shifts in the database, use those
      if (dbShifts && dbShifts.length > 0) {
        console.log('Using shifts from database:', dbShifts.length, 'shifts found');
        
        // Process shift assignments for each shift
        const processedShifts = dbShifts.map(shift => {
          const assignments = shift.shift_assignments || [];
          return {
            ...shift,
            is_assigned: assignments.length > 0,
            assigned_promoters: assignments.length
          };
        });
        
        const formattedShifts = formatDatabaseShifts(processedShifts);
        
        // Filter shifts based on user role
        const filteredShifts = filterShiftsByRole(formattedShifts, userRole, userId);
        
        // Clear out any stale local data
        localStorage.removeItem('shifts');
        
        setShifts(filteredShifts);
        console.log('Shifts loaded from database:', filteredShifts.length);
      } else {
        // Otherwise fall back to mock data
        console.log('No shifts in database, using mock data');
        
        const filteredShifts = filterShiftsByRole(mockShifts, userRole, userId);
        setShifts(filteredShifts);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      toast.error("Failed to load shifts", {
        description: "Please try again."
      });
      
      // Attempt to load from localStorage as fallback
      try {
        const savedShifts = localStorage.getItem('shifts');
        if (savedShifts) {
          const parsedShifts = JSON.parse(savedShifts);
          const allShifts = [...mockShifts, ...parsedShifts];
          const filteredShifts = filterShiftsByRole(allShifts, userRole, userId);
          setShifts(filteredShifts);
        } else {
          setShifts(filterShiftsByRole(mockShifts, userRole, userId));
        }
      } catch (localErr) {
        console.error('Error loading from localStorage:', localErr);
        setShifts(filterShiftsByRole(mockShifts, userRole, userId));
      }
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
      .channel('shifts-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shifts' }, 
        (payload) => {
          console.log('Realtime update received for shifts:', payload);
          refreshShifts();
        }
      )
      .subscribe();
      
    // Also listen for changes in the shift_assignments table
    const assignmentsChannel = supabase
      .channel('assignments-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shift_assignments' }, 
        (payload) => {
          console.log('Realtime update received for shift_assignments:', payload);
          refreshShifts();
        }
      )
      .subscribe();
    
    // Cleanup on unmount
    return () => {
      supabase.removeChannel(shiftsChannel);
      supabase.removeChannel(assignmentsChannel);
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
