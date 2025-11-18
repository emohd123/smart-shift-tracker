
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for handling certificate verification operations
 */
export const useCertificateVerification = () => {
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
      // Use the secure SECURITY DEFINER function for verification
      const { data, error } = await supabase.rpc(
        'verify_certificate_by_reference',
        { ref_number: referenceNumber }
      );
      
      if (error) {
        console.error("Error checking certificate validity:", error);
        return { valid: false, error };
      }
      
      // Certificate is valid if data is returned
      return { valid: data && data.length > 0, error: null };
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
    logCertificateVerification,
    checkCertificateValidity
  };
};
