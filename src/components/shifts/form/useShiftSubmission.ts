
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShiftFormData } from "../types/ShiftTypes";

// Helper function to send contract notifications
async function sendContractNotifications(
    companyId: string,
    promoterIds: string[],
    shiftId: string,
    shiftTitle: string
) {
    try {
      // Check if company has an active contract template
      const { data: template } = await supabase
        .from('company_contract_templates')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .maybeSingle();

      if (!template) {
        console.log('No active contract template found, skipping notifications');
        return;
      }

      // Check which promoters need to accept the contract
      const { data: existingAcceptances } = await supabase
        .from('company_contract_acceptances')
        .select('promoter_id')
        .eq('company_id', companyId);

      const acceptedPromoterIds = new Set(
        existingAcceptances?.map(a => a.promoter_id) || []
      );

      // Send notifications to promoters who haven't accepted
      const notificationsToSend = promoterIds
        .filter(id => !acceptedPromoterIds.has(id))
        .map(promoterId => ({
          user_id: promoterId,
          title: 'Contract Acceptance Required',
          message: `Please review and accept the contract before starting shift: ${shiftTitle}`,
          type: 'contract_required',
          read: false
        }));

      if (notificationsToSend.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notificationsToSend);

        if (notifError) {
          console.error('Error sending contract notifications:', notifError);
        } else {
          console.log(`Sent ${notificationsToSend.length} contract notifications`);
        }
      }
    } catch (error) {
      console.error('Error in sendContractNotifications:', error);
    }
}

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
      const shiftData = {
        title: formData.title,
        location: formData.location,
        date: formData.dateRange.from.toISOString().split('T')[0],
        end_date: formData.dateRange.to ? formData.dateRange.to.toISOString().split('T')[0] : null,
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
        
        const { data: updated, error: updateError } = await supabase
          .from('shifts')
          .update(shiftData)
          .eq('id', shiftId)
          .select('id')
          .single();
          
        if (updateError) throw updateError;
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
            
                      // Send contract notifications to assigned promoters
                      await sendContractNotifications(
                        user?.id || '',
                        formData.selectedPromoterIds,
                        resultShiftId,
                        formData.title
                      );
          }
        }
        
        toast.success("Shift created successfully");
      }
      
      navigate(`/shifts/${resultShiftId}`);
      
    } catch (error: any) {
      console.error("Error submitting shift:", error);
      toast.error(error.message || "Failed to create shift. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return { submitShift, loading };
}
