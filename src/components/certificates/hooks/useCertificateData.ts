
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CertificateData } from "../types/certificate";
import { useAuth } from "@/context/AuthContext";
import { isAdminLike } from "@/utils/roleUtils";

/**
 * Hook for handling certificate data operations
 */
export const useCertificateData = () => {
  const { user } = useAuth();

  const saveCertificateRecord = useCallback(async (
    userId: string,
    certificateData: CertificateData
  ) => {
    try {
      // First check if a record with this reference number already exists
      const { data: existingCert, error: checkError } = await supabase
        .from('certificates')
        .select('id')
        .eq('reference_number', certificateData.referenceNumber)
        .maybeSingle();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking for existing certificate:", checkError);
        toast.error("Failed to check existing certificates");
        return false;
      }
      
      // Determine if the user is an admin
      const isAdmin = isAdminLike(user?.role);
      
      // Default status - admins can auto-approve
      const certStatus = isAdmin ? 'approved' : 'pending';
      
      if (existingCert) {
        console.log("Certificate already exists, updating record");
        
        // Update existing record
        const { error: updateError } = await supabase
          .from('certificates')
          .update({
            total_hours: certificateData.totalHours,
            promotion_names: certificateData.promotionNames,
            skills_gained: certificateData.skillsGained,
            issued_date: new Date().toISOString(),
            position_title: certificateData.positionTitle,
            status: certStatus,
            issued_by: user?.id
          })
          .eq('reference_number', certificateData.referenceNumber);
          
        if (updateError) {
          console.error("Error updating certificate:", updateError);
          toast.error("Failed to update certificate record");
          return false;
        }
        
        return true;
      }
      
      // Insert new record with enhanced fields
      const { error } = await supabase
        .from('certificates')
        .insert([{
          user_id: userId,
          reference_number: certificateData.referenceNumber,
          time_period: certificateData.issueDate,
          total_hours: certificateData.totalHours,
          promotion_names: certificateData.promotionNames,
          skills_gained: certificateData.skillsGained,
          position_title: certificateData.positionTitle,
          certificate_type: 'work_experience',
          issue_date: new Date().toISOString().split('T')[0],
          status: certStatus,
          issued_by: user?.id
        }]);
        
      if (error) {
        console.error("Error saving certificate:", error);
        toast.error(`Failed to save certificate: ${error.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in saveCertificateRecord:", error);
      toast.error("An unexpected error occurred while saving certificate");
      return false;
    }
  }, [user]);

  return {
    saveCertificateRecord
  };
};
