
import { useState, useEffect, useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes"; // Update import path
import { mockShifts } from "@/utils/mockData";
import { useToast } from "@/hooks/use-toast";

interface UseShiftsDataProps {
  userId?: string;
  userRole?: string;
  isAuthenticated?: boolean;
}

export const useShiftsData = ({ userId, userRole, isAuthenticated }: UseShiftsDataProps) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Load shifts based on user role
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    
    // Simulate API request
    const timer = setTimeout(() => {
      try {
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
          : allShifts.filter(shift => 
              // In a real app, you'd filter by shifts assigned to this promoter
              // For now, we'll return all shifts for any non-admin
              true
            );
            
        setShifts(filteredShifts);
        setError(null);
      } catch (err) {
        console.error('Error fetching shifts:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        toast({
          title: "Error",
          description: "Failed to load shifts. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, userId, userRole, toast]);

  // Add a shift to the list
  const addShift = useCallback((shift: Shift) => {
    setShifts(prev => [shift, ...prev]);
    
    // Save to localStorage as well
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
  }, []);

  // Handle shift deletion
  const deleteShift = useCallback((id: string) => {
    try {
      console.log("Deleting shift with ID:", id);
      
      // Verify if user is admin before allowing deletion
      if (userRole !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admin users can delete shifts",
          variant: "destructive"
        });
        return;
      }
      
      // Remove the shift from the list - filter out the shift with matching ID
      setShifts(prev => {
        console.log("Previous shifts:", prev);
        const filtered = prev.filter(shift => shift.id !== id);
        console.log("Filtered shifts:", filtered);
        return filtered;
      });
      
      // Remove from localStorage if it exists there
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
      
      toast({
        title: "Shift Deleted",
        description: "The shift has been successfully deleted",
      });
      
      // In a real app, you'd make an API request to delete the shift from the database
      console.log("Deleting shift from database:", id);
    } catch (err) {
      console.error('Error deleting shift:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete shift'));
      toast({
        title: "Error",
        description: "Failed to delete shift. Please try again.",
        variant: "destructive"
      });
    }
  }, [userRole, toast]);

  return {
    shifts,
    loading,
    error,
    deleteShift,
    addShift
  };
};
