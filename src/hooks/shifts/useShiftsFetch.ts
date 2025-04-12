import { useState, useEffect } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { mockShifts } from "@/utils/mockData";
import { toast } from "sonner";
import { formatDatabaseShifts, filterShiftsByRole } from "./utils/shiftDataUtils";

interface UseShiftsFetchProps {
  userId?: string;
  userRole?: string;
  isAuthenticated?: boolean;
}

export const useShiftsFetch = ({ userId, userRole, isAuthenticated }: UseShiftsFetchProps) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load shifts based on user role
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    
    // Fetch shifts from Supabase
    const fetchShifts = async () => {
      try {
        // First check if we have actual shifts in the database
        const { data: dbShifts, error: dbError } = await supabase
          .from('shifts')
          .select('*');
        
        if (dbError) throw dbError;
        
        // If we have shifts in the database, use those
        if (dbShifts && dbShifts.length > 0) {
          console.log('Using shifts from database:', dbShifts);
          const formattedShifts = formatDatabaseShifts(dbShifts);
          
          // Filter shifts based on user role
          const filteredShifts = filterShiftsByRole(formattedShifts, userRole, userId);
          setShifts(filteredShifts);
        } else {
          // Otherwise fall back to mock data and localStorage
          console.log('No shifts in database, using mock data');
          
          // Check localStorage for any saved shifts
          const savedShifts = localStorage.getItem('shifts');
          let allShifts = mockShifts;
          
          if (savedShifts) {
            try {
              const parsedShifts = JSON.parse(savedShifts);
              allShifts = [...mockShifts, ...parsedShifts];
            } catch (e) {
              console.error('Error parsing saved shifts:', e);
            }
          }
          
          // Filter shifts based on user role
          const filteredShifts = filterShiftsByRole(allShifts, userRole, userId);
          setShifts(filteredShifts);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching shifts:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        toast.error("Failed to load shifts", {
          description: "Please try again."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchShifts();
  }, [isAuthenticated, userId, userRole]);

  return {
    shifts,
    loading,
    error,
    setShifts
  };
};
