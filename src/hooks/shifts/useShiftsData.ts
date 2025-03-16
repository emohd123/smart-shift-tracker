
import { useState, useEffect, useCallback } from "react";
import { Shift } from "@/components/shifts/ShiftCard";
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
        // If admin, show all shifts, otherwise filter for the specific user
        const filteredShifts = userRole === 'admin' 
          ? mockShifts 
          : mockShifts.filter(shift => 
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

  // Handle shift deletion
  const deleteShift = useCallback((id: string) => {
    try {
      // Verify if user is admin before allowing deletion
      if (userRole !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admin users can delete shifts",
          variant: "destructive"
        });
        return;
      }
      
      // Remove the shift from the list
      setShifts(prev => prev.filter(shift => shift.id !== id));
      
      toast({
        title: "Shift Deleted",
        description: "The shift has been successfully deleted",
      });
      
      // In a real app, you'd make an API request to delete the shift from the database
      console.log("Deleting shift:", id);
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
    deleteShift
  };
};
