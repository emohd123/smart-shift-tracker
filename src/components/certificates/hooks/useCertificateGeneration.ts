
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TimePeriod, CertificateData } from "../types/certificate";
import { useUserData, useShiftData } from "./useShiftData";
import { useCertificateActions } from "./useCertificateActions";
import { useCertificateStorage } from "./useCertificateStorage";

export function useCertificateGeneration(userId: string, timePeriod: TimePeriod) {
  const [loading, setLoading] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData | undefined>();
  
  const { fetchUserData, fetchPromoters } = useUserData();
  const { fetchCompletedShifts } = useShiftData();
  const { saveCertificateRecord } = useCertificateStorage();
  const { 
    downloading, 
    sharing, 
    handleDownload, 
    handleShare, 
    handleEmail 
  } = useCertificateActions(userId);
  
  const generateCertificate = useCallback(async () => {
    if (!userId) {
      toast.error("No user selected");
      return;
    }
    
    setLoading(true);
    try {
      // Fetch user data
      const userData = await fetchUserData(userId);
      
      if (!userData) {
        toast.error("Could not retrieve user data");
        setLoading(false);
        return;
      }
      
      // Fetch completed shifts
      const { shifts, timePeriodLabel } = await fetchCompletedShifts(userId, timePeriod);
      
      if (!shifts || shifts.length === 0) {
        toast.error("No shifts found for the selected time period");
        setLoading(false);
        return;
      }
      
      // Calculate total hours
      const totalHours = shifts.reduce((acc, shift) => {
        return acc + (shift.hours || 0);
      }, 0);
      
      if (totalHours <= 0) {
        toast.error("No hours recorded for the selected time period");
        setLoading(false);
        return;
      }
      
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
      const saved = await saveCertificateRecord(userId, newCertificateData);
      
      if (!saved) {
        toast.error("Failed to save certificate record");
        setLoading(false);
        return;
      }
      
      setCertificateData(newCertificateData);
      return newCertificateData;
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("An error occurred while generating the certificate");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, fetchCompletedShifts, saveCertificateRecord, userId, timePeriod]);
  
  return {
    certificateData,
    loading,
    downloading,
    sharing,
    generateCertificate,
    handleDownload: () => handleDownload(certificateData),
    handleShare,
    handleEmail: () => handleEmail(certificateData),
    fetchPromoters
  };
}
