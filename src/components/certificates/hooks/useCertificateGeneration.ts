
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { TimePeriod } from "../WorkCertificateGenerator";
import { toast } from "sonner";
import { generateCertificatePDF } from "../utils/pdfGenerator";
import { uploadFileToBucket } from "@/integrations/supabase/storageUtils";

// Mock data for demo purposes
const MOCK_SHIFTS = [
  { 
    date: "2023-12-15", 
    title: "Product Demo at Central Mall", 
    hours: 8,
    location: "Central Mall, Downtown"
  },
  { 
    date: "2023-12-22", 
    title: "Brand Promotion at Tech Expo", 
    hours: 6,
    location: "Convention Center"
  },
  { 
    date: "2024-01-05", 
    title: "New Product Launch", 
    hours: 8,
    location: "City Plaza"
  },
  { 
    date: "2024-01-18", 
    title: "Sales Event Promotion", 
    hours: 9,
    location: "Westfield Mall"
  }
];

export interface CertificateData {
  referenceNumber: string;
  promoterName: string;
  totalHours: number;
  positionTitle: string;
  promotionNames: string[];
  skillsGained: string[];
  shifts: { date: string; title: string; hours: number; location?: string }[];
  issueDate: string;
  managerContact: string;
  performanceRating: number;
}

export function useCertificateGeneration(userId: string, timePeriod: TimePeriod) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData | undefined>();
  
  const fetchUserData = useCallback(async () => {
    if (!userId) {
      toast.error("User not authenticated");
      return null;
    }
    
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return null;
      }
      
      return profileData;
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      return null;
    }
  }, [userId]);
  
  const fetchCompletedShifts = useCallback(async () => {
    // In a real implementation, we would query the time_logs and shifts tables
    // to get the actual completed shifts for the user within the time period
    
    // For demo purposes, we'll use mock data
    let timePeriodLabel;
    switch (timePeriod) {
      case "3months": timePeriodLabel = "Last 3 Months"; break;
      case "6months": timePeriodLabel = "Last 6 Months"; break;
      case "1year": timePeriodLabel = "Last Year"; break;
      case "all": timePeriodLabel = "All Time"; break;
    }
    
    // Simulate different numbers of shifts based on time period
    const filteredShifts = timePeriod === "3months" 
      ? MOCK_SHIFTS.slice(0, 2) 
      : timePeriod === "6months" 
        ? MOCK_SHIFTS.slice(0, 3)
        : MOCK_SHIFTS;
        
    return {
      shifts: filteredShifts,
      timePeriodLabel
    };
  }, [timePeriod]);
  
  const generateCertificate = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user data
      const userData = await fetchUserData();
      
      if (!userData) {
        toast.error("Could not retrieve user data");
        setLoading(false);
        return;
      }
      
      // Fetch completed shifts
      const { shifts, timePeriodLabel } = await fetchCompletedShifts();
      
      // Calculate total hours
      const totalHours = shifts.reduce((sum, shift) => sum + shift.hours, 0);
      
      // Generate a unique reference number
      const referenceNumber = `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
      
      // Extract unique promotion names
      const promotionNames = Array.from(new Set(shifts.map(shift => shift.title)));
      
      // Create certificate data
      const newCertificateData: CertificateData = {
        referenceNumber,
        promoterName: userData.full_name,
        totalHours,
        positionTitle: "Brand Promoter",
        promotionNames,
        skillsGained: ["Communication", "Customer Service", "Sales", "Event Promotion"],
        shifts,
        issueDate: format(new Date(), "MMMM dd, yyyy"),
        managerContact: "555-123-4567",
        performanceRating: 5
      };
      
      // Save certificate in database
      const { error: certError } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          reference_number: referenceNumber,
          time_period: timePeriodLabel,
          total_hours: totalHours,
          promotion_names: promotionNames
        });
        
      if (certError) {
        console.error("Error saving certificate:", certError);
        // Continue anyway for demo purposes
      }
      
      setCertificateData(newCertificateData);
      return newCertificateData;
    } catch (error) {
      console.error("Error generating certificate:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, fetchCompletedShifts, userId]);
  
  const handleDownload = useCallback(async () => {
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
      try {
        const file = new File([pdfBlob], `${certificateData.referenceNumber}.pdf`, { type: "application/pdf" });
        const path = `${userId}/${certificateData.referenceNumber}.pdf`;
        
        const { url: fileUrl, error } = await uploadFileToBucket(file, "certificates", path);
        
        if (error) {
          console.error("Error uploading PDF to storage:", error);
        } else if (fileUrl) {
          // Update certificate record with PDF URL
          const { error: updateError } = await supabase
            .from('certificates')
            .update({ pdf_url: fileUrl })
            .eq('reference_number', certificateData.referenceNumber);
            
          if (updateError) {
            console.error("Error updating certificate record:", updateError);
          }
        }
      } catch (uploadError) {
        console.error("Error in upload process:", uploadError);
      }
      
      toast.success("Certificate downloaded successfully");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Failed to download certificate");
    } finally {
      setDownloading(false);
    }
  }, [certificateData, userId]);
  
  const handleShare = useCallback(() => {
    setSharing(true);
    
    setTimeout(() => {
      toast.success("Share feature will be implemented in a future update");
      setSharing(false);
    }, 1000);
  }, []);
  
  const handleEmail = useCallback(() => {
    if (!certificateData) return;
    
    // In a real app, this would use an email service
    const subject = encodeURIComponent(`Work Certificate - ${certificateData.referenceNumber}`);
    const body = encodeURIComponent(
      `Please find attached my work certificate with reference number ${certificateData.referenceNumber}.`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    toast.success("Email client opened");
  }, [certificateData]);
  
  return {
    certificateData,
    loading,
    downloading,
    sharing,
    generateCertificate,
    handleDownload,
    handleShare,
    handleEmail
  };
}
