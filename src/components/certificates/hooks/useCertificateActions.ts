
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { CertificateData } from "../types/certificate";
import { generateCertificatePDF } from "../utils/pdfGenerator";
import { useCertificateStorage } from "./useCertificateStorage";
import { useAuth } from "@/context/AuthContext";

export const useCertificateActions = (userId: string) => {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { isAuthenticated, user } = useAuth();
  
  const { uploadCertificatePDF } = useCertificateStorage();
  
  const handleDownload = useCallback(async (certificateData: CertificateData | undefined) => {
    if (!certificateData) {
      toast.error("No certificate data available");
      return;
    }
    
    if (!isAuthenticated) {
      toast.error("You must be logged in to download certificates");
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
      
      // Upload to Supabase Storage if user is authenticated and has ID
      if (isAuthenticated && userId) {
        try {
          const fileUrl = await uploadCertificatePDF(userId, certificateData.referenceNumber, pdfBlob);
          if (fileUrl) {
            console.log("Certificate uploaded to storage:", fileUrl);
          }
        } catch (uploadError) {
          console.error("Error uploading certificate to storage:", uploadError);
          // Continue with local download even if cloud storage fails
        }
      }
      
      toast.success("Certificate downloaded successfully");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [userId, uploadCertificatePDF, isAuthenticated]);
  
  const handleShare = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to share certificates");
      return;
    }
    
    setSharing(true);
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Professional Work Certificate',
        text: 'Check out my professional work certificate from SmartShift',
        url: window.location.href,
      })
      .then(() => toast.success("Shared successfully"))
      .catch(error => {
        console.error("Error sharing:", error);
        toast.error("Failed to share. Try another method.");
      })
      .finally(() => setSharing(false));
    } else {
      // Fallback for browsers that don't support Web Share API
      setTimeout(() => {
        toast.success("Share feature will be implemented in a future update");
        setSharing(false);
      }, 1000);
    }
  }, [isAuthenticated]);
  
  const handleEmail = useCallback((certificateData: CertificateData | undefined) => {
    if (!certificateData) {
      toast.error("No certificate data available");
      return;
    }
    
    if (!isAuthenticated) {
      toast.error("You must be logged in to email certificates");
      return;
    }
    
    // In a real app, this would use an email service
    const subject = encodeURIComponent(`Professional Work Certificate - ${certificateData.referenceNumber}`);
    const body = encodeURIComponent(
      `Please find attached my professional work certificate with reference number ${certificateData.referenceNumber}.\n\n` +
      `This certificate validates that I have completed ${certificateData.totalHours} hours of professional work as a ${certificateData.positionTitle}.\n\n` +
      `To verify this certificate, please visit: https://verify-certificate.smartshift.com/${certificateData.referenceNumber}`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    toast.success("Email client opened with certificate details");
  }, [isAuthenticated]);
  
  return {
    downloading,
    sharing,
    handleDownload,
    handleShare,
    handleEmail
  };
};
