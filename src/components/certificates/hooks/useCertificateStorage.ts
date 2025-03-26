
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CertificateData } from "../types/certificate";
import { uploadFileToBucket } from "@/integrations/supabase/storageUtils";

/**
 * Hook for handling certificate storage operations
 */
export const useCertificateStorage = () => {
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
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking for existing certificate:", checkError);
      }
      
      if (existingCert) {
        console.log("Certificate already exists, updating record");
        
        // Update existing record
        const { error: updateError } = await supabase
          .from('certificates')
          .update({
            total_hours: certificateData.totalHours,
            promotion_names: certificateData.promotionNames,
            skills_gained: certificateData.skillsGained,
            issue_date: new Date().toISOString(),
            position_title: certificateData.positionTitle
          })
          .eq('reference_number', certificateData.referenceNumber);
          
        if (updateError) {
          console.error("Error updating certificate:", updateError);
          return false;
        }
        
        return true;
      }
      
      // Insert new record
      const { error } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          reference_number: certificateData.referenceNumber,
          time_period: certificateData.issueDate,
          total_hours: certificateData.totalHours,
          promotion_names: certificateData.promotionNames,
          skills_gained: certificateData.skillsGained,
          position_title: certificateData.positionTitle,
          performance_rating: certificateData.performanceRating,
          manager_contact: certificateData.managerContact
        });
        
      if (error) {
        console.error("Error saving certificate:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in saveCertificateRecord:", error);
      return false;
    }
  }, []);

  const uploadCertificatePDF = useCallback(async (
    userId: string,
    referenceNumber: string,
    pdfBlob: Blob
  ) => {
    try {
      const file = new File([pdfBlob], `${referenceNumber}.pdf`, { type: "application/pdf" });
      const path = `${userId}/${referenceNumber}.pdf`;
      
      const { url: fileUrl, error } = await uploadFileToBucket(file, "certificates", path);
      
      if (error) {
        console.error("Error uploading PDF to storage:", error);
        return null;
      }
      
      if (fileUrl) {
        // Update certificate record with PDF URL
        const { error: updateError } = await supabase
          .from('certificates')
          .update({ pdf_url: fileUrl })
          .eq('reference_number', referenceNumber);
          
        if (updateError) {
          console.error("Error updating certificate record:", updateError);
        }
      }
      
      return fileUrl;
    } catch (error) {
      console.error("Error in uploadCertificatePDF:", error);
      return null;
    }
  }, []);

  return {
    saveCertificateRecord,
    uploadCertificatePDF
  };
};
