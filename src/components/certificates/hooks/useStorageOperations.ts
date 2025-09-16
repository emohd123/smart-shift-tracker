
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Certificate } from "../types/certificate";
import { 
  uploadFileToBucket, 
  getFileFromBucket, 
  fileExistsInBucket, 
  createBucketIfNotExists 
} from "@/integrations/supabase/storageUtils";

// Simple in-memory PDF cache to avoid regenerating the same PDFs
const pdfBlobCache = new Map<string, Blob>();

/**
 * Hook for certificate storage operations with optimized performance
 */
export const useStorageOperations = () => {
  const certificateBucket = "certificates";

  // Ensure bucket exists
  const ensureBucketExists = useCallback(async () => {
    const { success, error } = await createBucketIfNotExists(certificateBucket, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024 // 10MB limit for PDFs
    });
    
    if (!success) {
      console.error("Failed to ensure certificate bucket exists:", error);
      return false;
    }
    
    return true;
  }, []);

  // Upload certificate PDF to storage
  const uploadCertificatePDF = useCallback(async (
    userId: string,
    referenceNumber: string,
    pdfBlob: Blob
  ): Promise<string | null> => {
    try {
      const bucketExists = await ensureBucketExists();
      if (!bucketExists) {
        return null;
      }
      
      // Create a File object from the Blob
      const pdfFile = new File([pdfBlob], `${referenceNumber}.pdf`, {
        type: "application/pdf",
        lastModified: new Date().getTime()
      });
      
      // Upload the file
      const filePath = `${userId}/${referenceNumber}.pdf`;
      const { data: url, error, success } = await uploadFileToBucket(
        pdfFile,
        certificateBucket,
        filePath,
        { upsert: true, cacheControl: "3600" }
      );
      
      if (!success || error) {
        console.error("Error uploading certificate PDF:", error);
        return null;
      }
      
      // Update the certificates table with the PDF URL
      const { error: updateError } = await supabase
        .from("certificates")
        .update({ pdf_url: url })
        .eq("reference_number", referenceNumber);
        
      if (updateError) {
        console.error("Error updating certificate with PDF URL:", updateError);
      }
      
      // Add to cache
      pdfBlobCache.set(`${userId}-${referenceNumber}`, pdfBlob);
      
      return url;
    } catch (error) {
      console.error("Unexpected error uploading certificate PDF:", error);
      return null;
    }
  }, [ensureBucketExists]);

  // Download certificate PDF from storage
  const downloadCertificatePDF = useCallback(async (
    userId: string,
    referenceNumber: string
  ): Promise<Blob | null> => {
    try {
      // Check cache first
      const cacheKey = `${userId}-${referenceNumber}`;
      if (pdfBlobCache.has(cacheKey)) {
        console.log("Using cached PDF blob");
        return pdfBlobCache.get(cacheKey) as Blob;
      }
      
      // Check if file exists
      const filePath = `${userId}/${referenceNumber}.pdf`;
      const existsResult = await fileExistsInBucket(
        certificateBucket,
        filePath
      );
      
      if (!existsResult.success || existsResult.error || !existsResult.data) {
        console.warn(`Certificate PDF not found: ${filePath}`);
        return null;
      }
      
      // Download the file
      const { data: blob, error, success } = await getFileFromBucket(
        certificateBucket,
        filePath
      );
      
      if (!success || error || !blob) {
        console.error("Error downloading certificate PDF:", error);
        return null;
      }
      
      // Cache the blob
      pdfBlobCache.set(cacheKey, blob);
      
      return blob;
    } catch (error) {
      console.error("Unexpected error downloading certificate PDF:", error);
      return null;
    }
  }, []);

  // Check if certificate exists
  const checkCertificateExists = useCallback(async (
    userId: string,
    referenceNumber: string | null = null,
    timePeriod: string | null = null
  ): Promise<{ exists: boolean; error?: PostgrestError; data?: unknown }> => {
    try {
      let query = supabase
        .from("certificates")
        .select("*")
        .eq("user_id", userId);
      
      if (referenceNumber) {
        query = query.eq("reference_number", referenceNumber);
      }
      
      if (timePeriod) {
        query = query.eq("time_period", timePeriod);
      }
      
      const { data, error } = await query
        .order("issued_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        return { exists: false, error };
      }
      
      return { exists: !!data, data };
    } catch (error) {
      console.error("Error checking certificate existence:", error);
      return { exists: false, error };
    }
  }, []);

  // Clear PDF cache
  const clearPDFCache = useCallback(() => {
    pdfBlobCache.clear();
  }, []);

  return {
    uploadCertificatePDF,
    downloadCertificatePDF,
    checkCertificateExists,
    clearPDFCache
  };
};
