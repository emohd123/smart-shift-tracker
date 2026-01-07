
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShiftFormData } from "../types/ShiftTypes";
import { formatDateLocal } from "@/utils/dateUtils";

  export default function useShiftSubmission(shiftId?: string) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isEditMode = !!shiftId;

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
      // Use formatDateLocal to prevent timezone shifts
      const shiftData = {
        title: formData.title,
        location: formData.location,
        date: formatDateLocal(formData.dateRange.from),
        end_date: formData.dateRange.to ? formatDateLocal(formData.dateRange.to) : null,
        start_time: formData.startTime,
        end_time: formData.endTime,
        pay_rate: formData.payRate ? parseFloat(formData.payRate) : null,
        pay_rate_type: formData.payRateType,
        company_id: user?.id || null
      };
      
      let resultShiftId: string;
      
      if (isEditMode) {
        // UPDATE existing shift
        console.log("Updating shift:", shiftId, shiftData);
        
        // First, get the current shift to preserve status
        const { data: currentShift, error: fetchError } = await supabase
          .from('shifts')
          .select('status')
          .eq('id', shiftId)
          .single();
        
        if (fetchError) throw fetchError;
        
        // Preserve the status unless it's being explicitly changed
        const updateData = {
          ...shiftData,
          status: currentShift?.status || 'upcoming'
        };
        
        const { data: updated, error: updateError } = await supabase
          .from('shifts')
          .update(updateData)
          .eq('id', shiftId)
          .select('id')
          .single();
          
        if (updateError) {
          console.error("Update error details:", updateError);
          throw updateError;
        }
        
        if (!updated) {
          throw new Error("Update succeeded but no data returned");
        }
        
        resultShiftId = updated.id;
        
        toast.success("Shift updated successfully");
      } else {
        // INSERT new shift
        const insertData = { ...shiftData, status: 'upcoming' };
        console.log("Creating shift:", insertData);
        
        const { data: created, error: insertError } = await supabase
          .from('shifts')
          .insert(insertData)
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        resultShiftId = created.id;
        console.log("Shift created with ID:", resultShiftId);
        
        // If promoters were selected, assign them to the shift
        if (formData.selectedPromoterIds.length > 0) {
          const promoterAssignments = formData.selectedPromoterIds.map(promoterId => ({
            shift_id: resultShiftId,
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
            // Contract acceptance records and notifications are now automatically created
            // by database triggers when shift assignments are created
          }
        }
        
        toast.success("Shift created successfully");
      }
      
      navigate(`/shifts/${resultShiftId}`);
      
    } catch (error: any) {
      console.error("Error submitting shift:", error);
      const errorMessage = error?.message || error?.details || error?.hint || "Unknown error";
      const action = isEditMode ? "update" : "create";
      toast.error(`Failed to ${action} shift`, {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return { submitShift, loading };
}
