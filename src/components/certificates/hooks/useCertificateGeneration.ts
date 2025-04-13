
import { useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TimePeriod, CertificateData } from "../types/certificate";
import { useUserData, useShiftData } from "./useShiftData";
import { useCertificateActions } from "./useCertificateActions";
import { useCertificateStorage } from "./useCertificateStorage";

export function useCertificateGeneration(userId: string, timePeriod: TimePeriod) {
  const [loading, setLoading] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData | undefined>();
  const generationInProgress = useRef(false);
  
  const { fetchUserData, fetchPromoters } = useUserData();
  const { fetchCompletedShifts } = useShiftData();
  const { saveCertificateRecord, checkCertificateExists } = useCertificateStorage();
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
    
    // Prevent multiple concurrent generation attempts
    if (generationInProgress.current) {
      console.log("Certificate generation already in progress");
      return;
    }
    
    generationInProgress.current = true;
    setLoading(true);
    
    try {
      // Show immediate feedback
      toast.loading("Preparing certificate data...");
      
      // First check if we already have a certificate for this user/time period
      const timeKey = `${userId}-${timePeriod}-${new Date().toISOString().substring(0, 10)}`;
      const referenceNumber = `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase();
      
      const { exists, data: existingCert } = await checkCertificateExists(userId, null, timePeriod);
      
      if (exists && existingCert) {
        console.log("Using existing certificate data");
        toast.dismiss();
        toast.success("Certificate loaded from cache");
        setCertificateData(existingCert as CertificateData);
        setLoading(false);
        generationInProgress.current = false;
        return existingCert as CertificateData;
      }
      
      // Fetch user data
      const userData = await fetchUserData(userId);
      
      if (!userData) {
        toast.dismiss();
        toast.error("Could not retrieve user data");
        setLoading(false);
        generationInProgress.current = false;
        return;
      }
      
      toast.loading("Fetching shift data...");
      
      // Fetch completed shifts
      const { shifts, timePeriodLabel } = await fetchCompletedShifts(userId, timePeriod);
      
      if (!shifts || shifts.length === 0) {
        toast.dismiss();
        toast.error("No shifts found for the selected time period");
        setLoading(false);
        generationInProgress.current = false;
        return;
      }
      
      // Calculate total hours
      const totalHours = shifts.reduce((acc, shift) => {
        return acc + (shift.hours || 0);
      }, 0);
      
      if (totalHours <= 0) {
        toast.dismiss();
        toast.error("No hours recorded for the selected time period");
        setLoading(false);
        generationInProgress.current = false;
        return;
      }
      
      toast.loading("Generating certificate...");
      
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
        toast.dismiss();
        toast.error("Failed to save certificate record");
        setLoading(false);
        generationInProgress.current = false;
        return;
      }
      
      toast.dismiss();
      toast.success("Certificate generated successfully!");
      
      setCertificateData(newCertificateData);
      generationInProgress.current = false;
      return newCertificateData;
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.dismiss();
      toast.error("An error occurred while generating the certificate");
      throw error;
    } finally {
      setLoading(false);
      generationInProgress.current = false;
    }
  }, [fetchUserData, fetchCompletedShifts, saveCertificateRecord, checkCertificateExists, userId, timePeriod]);
  
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
