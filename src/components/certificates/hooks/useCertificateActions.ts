
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { CertificateData } from "./useCertificateGeneration";
import { generateCertificatePDF } from "../utils/pdfGenerator";
import { useCertificateStorage } from "./useCertificateStorage";

/**
 * Hook for certificate actions like download, share, email
 */
export const useCertificateActions = (userId: string) => {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  
  const { uploadCertificatePDF } = useCertificateStorage();
  
  const handleDownload = useCallback(async (certificateData: CertificateData | undefined) => {
    if (!certificateData) {
      toast.error("No certificate data available");
      return;
    }
    
    setDownloading(true);
    try {
      // Generate PDF blob
      const pdfBlob = await generateCertificatePDF(certificateData);
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(pdfBlob);
      
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate-${certificateData.referenceNumber}.pdf`;
      
      // Click the link to trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Upload to Supabase Storage
      if (userId) {
        await uploadCertificatePDF(userId, certificateData.referenceNumber, pdfBlob);
      }
      
      toast.success("Certificate downloaded successfully");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate");
    } finally {
      setDownloading(false);
    }
  }, [userId, uploadCertificatePDF]);
  
  const handleShare = useCallback(() => {
    setSharing(true);
    
    setTimeout(() => {
      toast.success("Share feature will be implemented in a future update");
      setSharing(false);
    }, 1000);
  }, []);
  
  const handleEmail = useCallback((certificateData: CertificateData | undefined) => {
    if (!certificateData) return;
    
    // In a real app, this would use an email service
    const subject = encodeURIComponent(`Work Certificate - ${certificateData.referenceNumber}`);
    const body = encodeURIComponent(
      `Please find attached my work certificate with reference number ${certificateData.referenceNumber}.`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    toast.success("Email client opened");
  }, []);
  
  return {
    downloading,
    sharing,
    handleDownload,
    handleShare,
    handleEmail
  };
};
