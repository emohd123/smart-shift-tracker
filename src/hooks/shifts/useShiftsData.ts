import { useState, useEffect, useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { mockShifts } from "@/utils/mockData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UseShiftsDataProps {
  userId?: string;
  userRole?: string;
  isAuthenticated?: boolean;
}

export const useShiftsData = ({ userId, userRole, isAuthenticated }: UseShiftsDataProps) => {
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
          const formattedShifts = dbShifts.map(shift => ({
            ...shift,
            id: shift.id,
            date: shift.date,
            endDate: shift.end_date,
            startTime: shift.start_time,
            endTime: shift.end_time,
            payRate: shift.pay_rate,
            status: shift.status,
            isPaid: shift.is_paid
          }));
          
          // If admin, show all shifts, otherwise filter for relevant shifts
          const filteredShifts = userRole === 'admin' 
            ? formattedShifts 
            : formattedShifts;
            
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
          
          // If admin, show all shifts, otherwise filter for the specific user
          const filteredShifts = userRole === 'admin' 
            ? allShifts 
            : allShifts.filter(shift => true);
              
          setShifts(filteredShifts);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching shifts:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        toast.error("Failed to load shifts. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchShifts();
  }, [isAuthenticated, userId, userRole]);

  // Add a shift to the list
  const addShift = useCallback(async (shift: Shift) => {
    try {
      // First try to add to Supabase
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          id: shift.id,
          title: shift.title,
          date: shift.date,
          end_date: shift.endDate,
          start_time: shift.startTime,
          end_time: shift.endTime,
          location: shift.location,
          status: shift.status,
          pay_rate: shift.payRate,
          pay_rate_type: 'hour',
          is_paid: shift.isPaid || false
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      console.log('Shift added to database:', data);
      
      // Then update local state
      setShifts(prev => [shift, ...prev]);
      
      // Save to localStorage as fallback
      try {
        const savedShifts = localStorage.getItem('shifts');
        let newSavedShifts = [shift];
        
        if (savedShifts) {
          try {
            const parsedShifts = JSON.parse(savedShifts);
            newSavedShifts = [shift, ...parsedShifts];
          } catch (e) {
            console.error('Error parsing saved shifts:', e);
          }
        }
        
        localStorage.setItem('shifts', JSON.stringify(newSavedShifts));
      } catch (e) {
        console.error('Error saving shift to localStorage:', e);
      }
      
      toast.success("Shift added successfully");
    } catch (error) {
      console.error('Error adding shift:', error);
      toast.error("Failed to add shift to database. Saving locally only.");
      
      // If database save fails, at least update local state
      setShifts(prev => [shift, ...prev]);
    }
  }, []);

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
      
      // First try to delete from Supabase
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting shift from database:', error);
        throw error;
      }
      
      console.log("Shift deleted from database");
      
      // Then remove the shift from the local state 
      setShifts(prev => {
        console.log("Previous shifts count:", prev.length);
        const filtered = prev.filter(shift => shift.id !== id);
        console.log("Filtered shifts count:", filtered.length);
        console.log("Removed:", prev.length - filtered.length, "shifts");
        return filtered;
      });
      
      // Update localStorage if it exists there
      try {
        const savedShifts = localStorage.getItem('shifts');
        if (savedShifts) {
          const parsedShifts = JSON.parse(savedShifts);
          const updatedShifts = parsedShifts.filter((shift: Shift) => shift.id !== id);
          localStorage.setItem('shifts', JSON.stringify(updatedShifts));
        }
      } catch (e) {
        console.error('Error removing shift from localStorage:', e);
      }
      
      toast.success("Shift Deleted", {
        description: "The shift has been successfully deleted"
      });
      
    } catch (err) {
      console.error('Error deleting shift:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete shift'));
      toast.error("Failed to delete shift. Please try again.");
    }
  }, [userRole]);

  return {
    shifts,
    loading,
    error,
    deleteShift,
    addShift
  };
};
