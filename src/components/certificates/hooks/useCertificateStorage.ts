import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CertificateData } from "../types/certificate";
import { 
  uploadFileToBucket, 
  getFileFromBucket, 
  fileExistsInBucket,
  createBucketIfNotExists,
  getPublicUrl,
  normalizePath,
  joinPaths
} from "@/integrations/supabase/storage";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook for handling certificate storage operations
 */
export const useCertificateStorage = () => {
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
      const isAdmin = user?.role === 'admin';
      
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
        .insert({
          user_id: userId,
          reference_number: certificateData.referenceNumber,
          time_period: certificateData.issueDate,
          total_hours: certificateData.totalHours,
          promotion_names: certificateData.promotionNames,
          skills_gained: certificateData.skillsGained,
          position_title: certificateData.positionTitle,
          performance_rating: certificateData.performanceRating,
          manager_contact: certificateData.managerContact,
          status: certStatus,
          issued_by: user?.id,
          issued_date: new Date().toISOString(),
          // Expiration date optional, calculated if needed
          expiration_date: certificateData.expirationDate || null
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
  }, [user]);

  const checkCertificateExists = useCallback(async (
    userId: string,
    referenceNumber: string
  ) => {
    try {
      // Ensure certificate bucket exists
      const bucketResult = await createBucketIfNotExists("certificates");
      if (!bucketResult.success) {
        console.error("Failed to ensure certificates bucket exists:", bucketResult.error);
        return { exists: false, error: bucketResult.error };
      }

      // Check if PDF exists in storage using properly joined path
      const path = joinPaths(userId, `${referenceNumber}.pdf`);
      const fileResult = await fileExistsInBucket("certificates", path);
      
      if (!fileResult.success) {
        console.error("Error checking if certificate exists:", fileResult.error);
        return { exists: false, error: fileResult.error };
      }
      
      return { exists: !!fileResult.data };
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
      const path = joinPaths(userId, `${referenceNumber}.pdf`);
      
      // Upload the PDF file
      const uploadResult = await uploadFileToBucket(file, "certificates", path);
      
      if (!uploadResult.success || !uploadResult.data) {
        console.error("Error uploading PDF to storage:", uploadResult.error);
        toast.error("Failed to upload certificate PDF");
        return null;
      }
      
      // Get the public URL
      const urlResult = getPublicUrl("certificates", path);
      const publicUrl = urlResult.success ? urlResult.data : uploadResult.data;
      
      // Update certificate record with PDF URL
      const { error: updateError } = await supabase
        .from('certificates')
        .update({ pdf_url: publicUrl })
        .eq('reference_number', referenceNumber);
        
      if (updateError) {
        console.error("Error updating certificate record:", updateError);
        toast.error("Failed to update certificate with PDF URL");
      }
      
      return publicUrl;
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
      const path = joinPaths(userId, `${referenceNumber}.pdf`);
      
      const downloadResult = await getFileFromBucket("certificates", path);
      
      if (!downloadResult.success) {
        console.error("Error downloading certificate PDF:", downloadResult.error);
        toast.error("Failed to download certificate PDF");
        return null;
      }
      
      return downloadResult.data;
    } catch (error) {
      console.error("Error in downloadCertificatePDF:", error);
      toast.error("An unexpected error occurred while downloading PDF");
      return null;
    }
  }, []);

  const logCertificateVerification = useCallback(async (
    referenceNumber: string
  ) => {
    try {
      // Get client IP and user agent
      const ipAddress = "client-ip"; // In a real app, you would get this from the request
      const userAgent = navigator.userAgent;
      
      // Call the RPC function to log verification
      const { error } = await supabase.rpc(
        'log_certificate_verification',
        { 
          ref_number: referenceNumber,
          ip_address: ipAddress,
          user_agent: userAgent
        }
      );
      
      if (error) {
        console.error("Error logging certificate verification:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in logCertificateVerification:", error);
      return false;
    }
  }, []);
  
  const checkCertificateValidity = useCallback(async (
    referenceNumber: string
  ) => {
    try {
      // Call the RPC function to check if certificate is valid
      const { data, error } = await supabase.rpc(
        'is_certificate_valid',
        { ref_number: referenceNumber }
      );
      
      if (error) {
        console.error("Error checking certificate validity:", error);
        return { valid: false, error };
      }
      
      return { valid: !!data, error: null };
    } catch (error) {
      console.error("Error in checkCertificateValidity:", error);
      return { 
        valid: false, 
        error: {
          message: error instanceof Error ? error.message : "Unknown error checking certificate validity",
          code: "CERTIFICATE_VALIDITY_CHECK_ERROR"
        }
      };
    }
  }, []);

  return {
    saveCertificateRecord,
    uploadCertificatePDF,
    downloadCertificatePDF,
    checkCertificateExists,
    logCertificateVerification,
    checkCertificateValidity
  };
};
