
import { useState, useEffect } from "react";
import { Shift } from "@/components/shifts/ShiftCard";
import { ShiftStatus } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mockShifts } from "@/utils/mockData";

interface UseShiftsDataProps {
  userId: string | undefined;
  userRole: string | undefined;
  isAuthenticated: boolean;
}

export const useShiftsData = ({ userId, userRole, isAuthenticated }: UseShiftsDataProps) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch shifts from Supabase
    const fetchShifts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('shifts')
          .select(`
            id,
            title,
            date,
            start_time,
            end_time,
            location,
            status,
            pay_rate,
            is_paid
          `);
        
        // If user is a promoter, only fetch shifts assigned to them
        if (userRole === "promoter") {
          // First get the shift IDs assigned to this promoter
          const { data: assignmentData, error: assignmentError } = await supabase
            .from('shift_assignments')
            .select('shift_id')
            .eq('promoter_id', userId);
          
          if (assignmentError) throw assignmentError;
          
          // If there are assignments, filter shifts by these IDs
          if (assignmentData && assignmentData.length > 0) {
            const shiftIds = assignmentData.map(assignment => assignment.shift_id);
            query = query.in('id', shiftIds);
          } else {
            // If no assignments, return early with empty array
            setShifts([]);
            setLoading(false);
            return;
          }
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data) {
          // Format the data to match our Shift interface
          const formattedShifts: Shift[] = data.map(item => ({
            id: item.id,
            title: item.title,
            date: item.date,
            startTime: item.start_time,
            endTime: item.end_time,
            location: item.location,
            status: item.status as ShiftStatus,
            payRate: Number(item.pay_rate),
            isPaid: Boolean(item.is_paid)
          }));
          
          setShifts(formattedShifts);
        }
      } catch (error) {
        console.error("Error fetching shifts:", error);
        toast({
          title: "Error",
          description: "Failed to load shifts",
          variant: "destructive"
        });
        
        // Fallback to mock data if there's an error
        setShifts(mockShifts);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchShifts();
    }
  }, [userId, userRole, isAuthenticated, toast]);

  // This function could be called from other components via a context
  // For now we're just exposing it so ShiftDetails can update the master list
  const deleteShift = (id: string) => {
    setShifts(prev => prev.filter(shift => shift.id !== id));
  };

  return { shifts, loading, deleteShift };
};
