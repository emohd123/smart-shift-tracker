
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDatabaseShifts } from "@/hooks/shifts/utils/shiftDataUtils";

export function useShiftDetail(shiftId: string | undefined) {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShift = async () => {
    if (!shiftId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        const formatted = formatDatabaseShifts([data])[0];
        setShift(formatted);
      } else {
        toast({
          title: "Shift Not Found",
          description: "The requested shift could not be found",
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error("Error loading shift:", e);
      toast({
        title: "Error",
        description: "Failed to load shift details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load shift data
  useEffect(() => {
    fetchShift();
  }, [shiftId]);

  const handleDelete = async (shiftIdToDelete: string) => {
    try {
      // Use global deleteShift function if available (for admin)
      if (window.deleteShift) {
        await window.deleteShift(shiftIdToDelete);
      } else {
        // Fallback to direct deletion
        const { error } = await supabase
          .from('shifts')
          .delete()
          .eq('id', shiftIdToDelete);

        if (error) throw error;
      }

      toast({
        title: "Shift Deleted",
        description: "The shift has been successfully deleted",
      });
      
      navigate("/shifts");
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the shift. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    isAuthenticated,
    shift,
    loading,
    handleDelete,
    navigate,
    userRole: user?.role,
    refreshShift: fetchShift,
  };
}
