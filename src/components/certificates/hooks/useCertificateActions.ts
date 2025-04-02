
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { CertificateData } from "../types/certificate";
import { generateCertificatePDF } from "../utils/pdfGenerator";
import { useCertificateStorage } from "./useCertificateStorage";
import { useAuth } from "@/context/AuthContext";

export const useCertificateActions = (userId: string) => {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const { uploadCertificatePDF, downloadCertificatePDF } = useCertificateStorage();
  
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
      console.log("Attempting to download certificate:", certificateData.referenceNumber);
      
      // First try to download existing PDF from storage
      const existingPdf = await downloadCertificatePDF(userId, certificateData.referenceNumber);
      
      if (existingPdf) {
        console.log("Found existing PDF, using that");
        // Create a URL for the Blob
        const url = URL.createObjectURL(existingPdf);
        
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
        
        toast.success("Certificate downloaded successfully");
        setDownloading(false);
        return;
      }
      
      // If no existing PDF, generate one
      console.log("No existing PDF found, generating new one");
      const pdfBlob = await generateCertificatePDF(certificateData);
      if (!pdfBlob) {
        throw new Error("Failed to generate PDF");
      }
      
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
        console.log("Uploading certificate to Supabase storage");
        try {
          const fileUrl = await uploadCertificatePDF(userId, certificateData.referenceNumber, pdfBlob);
          if (fileUrl) {
            console.log("Certificate uploaded to storage:", fileUrl);
          } else {
            console.warn("Failed to upload certificate to storage");
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
  }, [userId, uploadCertificatePDF, downloadCertificatePDF, isAuthenticated]);
  
  const handleShare = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to share certificates");
      return;
    }
    
    setSharing(true);
    try {
      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: 'Professional Work Certificate',
          text: 'Check out my professional work certificate from SmartShift',
          url: window.location.href,
        });
        toast.success("Shared successfully");
      } else {
        // Fallback for browsers that don't support Web Share API
        // Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard! You can now share it manually.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share. Try another method.");
    } finally {
      setSharing(false);
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
      `To verify this certificate, please visit: ${window.location.origin}/verify-certificate/${certificateData.referenceNumber}`
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
