
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  uploadFileToBucket, 
  getFileFromBucket, 
  fileExistsInBucket,
  createBucketIfNotExists,
  getPublicUrl,
  joinPaths
} from "@/integrations/supabase/storage";

/**
 * Hook for handling certificate storage file operations
 */
export const useStorageOperations = () => {
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

  return {
    uploadCertificatePDF,
    downloadCertificatePDF,
    checkCertificateExists
  };
};
