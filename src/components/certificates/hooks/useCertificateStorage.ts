
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CertificateData } from "../types/certificate";
import { 
  uploadFileToBucket, 
  getFileFromBucket, 
  fileExistsInBucket,
  createBucketIfNotExists 
} from "@/integrations/supabase/storageUtils";

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
        .maybeSingle();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking for existing certificate:", checkError);
        toast.error("Failed to check existing certificates");
        return false;
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
          toast.error("Failed to update certificate record");
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
        toast.error(`Failed to save certificate: ${error.message}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in saveCertificateRecord:", error);
      toast.error("An unexpected error occurred while saving certificate");
      return false;
    }
  }, []);

  const checkCertificateExists = useCallback(async (
    userId: string,
    referenceNumber: string
  ) => {
    try {
      // Ensure certificate bucket exists
      const { success, error: bucketError } = await createBucketIfNotExists("certificates");
      if (!success) {
        console.error("Failed to ensure certificates bucket exists:", bucketError);
        return { exists: false, error: bucketError };
      }

      // Check if PDF exists in storage
      const path = `${userId}/${referenceNumber}.pdf`;
      const { exists, error } = await fileExistsInBucket("certificates", path);
      
      if (error) {
        console.error("Error checking if certificate exists:", error);
        return { exists: false, error };
      }
      
      return { exists };
    } catch (error) {
      console.error("Error in checkCertificateExists:", error);
      return { 
        exists: false, 
        error: {
          message: error instanceof Error ? error.message : "Unknown error checking certificate existence",
          code: "CERTIFICATE_CHECK_ERROR"
        }
      };
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
        toast.error("Failed to upload certificate PDF");
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
          toast.error("Failed to update certificate with PDF URL");
        }
      }
      
      return fileUrl;
    } catch (error) {
      console.error("Error in uploadCertificatePDF:", error);
      toast.error("An unexpected error occurred while uploading PDF");
      return null;
    }
  }, []);

  const downloadCertificatePDF = useCallback(async (
    userId: string,
    referenceNumber: string
  ) => {
    try {
      const path = `${userId}/${referenceNumber}.pdf`;
      
      const { data, error } = await getFileFromBucket("certificates", path);
      
      if (error) {
        console.error("Error downloading certificate PDF:", error);
        toast.error("Failed to download certificate PDF");
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error in downloadCertificatePDF:", error);
      toast.error("An unexpected error occurred while downloading PDF");
      return null;
    }
  }, []);

  return {
    saveCertificateRecord,
    uploadCertificatePDF,
    downloadCertificatePDF,
    checkCertificateExists
  };
};
