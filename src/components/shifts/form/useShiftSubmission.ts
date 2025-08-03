
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShiftFormData } from "../types/ShiftTypes";

export default function useShiftSubmission() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const submitShift = async (formData: ShiftFormData, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      setLoading(true);
      
      // Debug authentication state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Current session:", session);
      console.log("Current user:", user);
      console.log("Session error:", sessionError);
      
      if (!session) {
        toast.error("Authentication required. Please log in again.");
        return;
      }
      
      if (!formData.dateRange?.from) {
        toast.error("Start date is required");
        return;
      }
      
      // Format the data for database
      const shiftData = {
        title: formData.title,
        location: formData.location,
        date: formData.dateRange.from.toISOString().split('T')[0],
        end_date: formData.dateRange.to ? formData.dateRange.to.toISOString().split('T')[0] : null,
        start_time: formData.startTime,
        end_time: formData.endTime,
        pay_rate: formData.payRate ? parseFloat(formData.payRate) : null,
        pay_rate_type: formData.payRateType,
        status: 'scheduled'
      };
      
      console.log("Submitting shift:", shiftData);
      
      // Insert the shift into the database
      const { data: shiftResult, error: shiftError } = await supabase
        .from('shifts')
        .insert(shiftData)
        .select('id')
        .single();
      
      if (shiftError) {
        throw shiftError;
      }
      
      const shiftId = shiftResult.id;
      console.log("Shift created with ID:", shiftId);
      
      // If promoters were selected, assign them to the shift
      if (formData.selectedPromoterIds.length > 0) {
        const promoterAssignments = formData.selectedPromoterIds.map(promoterId => ({
          shift_id: shiftId,
          promoter_id: promoterId
        }));
        
        console.log("Creating promoter assignments:", promoterAssignments);
        
        const { error: assignmentError } = await supabase
          .from('shift_assignments')
          .insert(promoterAssignments);
        
        if (assignmentError) {
          console.error("Error assigning promoters:", assignmentError);
          toast.error("Shift created but there was an error assigning promoters");
        } else {
          console.log("Successfully assigned promoters to shift");
        }
      }
      
      // Show success message and redirect
      toast.success("Shift created successfully");
      navigate("/shifts");
      
    } catch (error: any) {
      console.error("Error submitting shift:", error);
      toast.error(error.message || "Failed to create shift. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { submitShift, loading };
}
