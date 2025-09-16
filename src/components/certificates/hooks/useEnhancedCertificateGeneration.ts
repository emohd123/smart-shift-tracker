import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TimePeriod, WorkExperienceData } from "../types/certificate";
import { useWorkExperienceData } from "./useWorkExperienceData";
import { useUserData, ShiftData } from "./useShiftData";
import { generateEnhancedWorkExperiencePDF } from "../utils/enhancedPdfGenerator";

type GenerateOptions = {
  timePeriod: TimePeriod;
  selectedShifts: string[];
  template: string;
  includeDescription: boolean;
  includeMetrics: boolean;
  customMessage: string;
};

export const useEnhancedCertificateGeneration = (userId: string) => {
  const { user } = useAuth();
  const [certificateData, setCertificateData] = useState<WorkExperienceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [availableShifts, setAvailableShifts] = useState<ShiftData[]>([]);

  const { fetchWorkExperienceData } = useWorkExperienceData();
  const { fetchPromoters } = useUserData();

  const generateCertificate = async (options?: GenerateOptions) => {
    if (!user) {
      toast.error("Please login to generate certificates");
      return;
    }

    setLoading(true);
    setCertificateData(null);

    try {
      // Fetch work experience data with selected shifts
      const workData = await fetchWorkExperienceData(userId, options?.timePeriod || "6months");

      if (workData) {
        setCertificateData(workData);
        // Save enhanced certificate to database
        await saveCertificateToDatabase(workData, options || { timePeriod: "6months", selectedShifts: [], template: "professional", includeDescription: true, includeMetrics: true, customMessage: "" });
      }
    } catch (error) {
      console.error('Enhanced certificate generation failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveCertificateToDatabase = async (data: WorkExperienceData, options: GenerateOptions) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          reference_number: data.referenceNumber,
          time_period: options.timePeriod,
          total_hours: data.totalHours,
          performance_rating: data.performanceRating,
          issued_by: user?.id,
          manager_contact: data.managerContact,
          promotion_names: data.roles,
          position_title: 'Enhanced Work Experience',
          skills_gained: ['Enhanced Documentation', 'Professional Development', 'Comprehensive Experience'],
          status: 'approved'
        });

      if (error) {
        console.error('Error saving enhanced certificate:', error);
        toast.error("Certificate generated but not saved to database");
      }
    } catch (error) {
      console.error('Error saving enhanced certificate:', error);
    }
  };

  const handleDownload = async () => {
    if (!certificateData) {
      toast.error("No certificate data available");
      return;
    }

    setDownloading(true);
    try {
      const pdfBlob = await generateEnhancedWorkExperiencePDF(certificateData);
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `enhanced_work_certificate_${certificateData.referenceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Enhanced certificate downloaded successfully!");
    } catch (error) {
      console.error('Enhanced download failed:', error);
      toast.error("Failed to download enhanced certificate");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!certificateData) {
      toast.error("No certificate data available");
      return;
    }

    setSharing(true);
    try {
      const shareText = `My comprehensive enhanced work experience certificate is ready! Total hours: ${certificateData.totalHours}. Reference: ${certificateData.referenceNumber}`;
      const shareUrl = `${window.location.origin}/verify-certificate/${certificateData.referenceNumber}`;

      if (navigator.share) {
        await navigator.share({
          title: "Enhanced Work Experience Certificate",
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\nVerify at: ${shareUrl}`);
        toast.success("Enhanced certificate details copied to clipboard!");
      }
    } catch (error) {
      console.error('Enhanced sharing failed:', error);
      toast.error("Failed to share enhanced certificate");
    } finally {
      setSharing(false);
    }
  };

  const handleEmail = async () => {
    if (!certificateData) {
      toast.error("No certificate data available");
      return;
    }

    try {
      const subject = `Enhanced Work Experience Certificate - ${certificateData.promoterName}`;
      const body = `Dear Hiring Manager,%0D%0A%0D%0AI am pleased to share my comprehensive enhanced work experience certificate (Reference: ${certificateData.referenceNumber}).%0D%0A%0D%0AEnhanced Work Summary:%0D%0A- Total Hours: ${certificateData.totalHours} hours%0D%0A- Total Shifts: ${certificateData.totalShifts} shifts%0D%0A- Work Period: ${certificateData.workPeriod.startDate} to ${certificateData.workPeriod.endDate}%0D%0A- Performance Rating: ${certificateData.performanceRating}/5%0D%0A- Roles: ${certificateData.roles.join(', ')}%0D%0A- Locations: ${certificateData.locations.join(', ')}%0D%0A%0D%0AThis enhanced certificate includes detailed work descriptions, comprehensive metrics, and professional branding.%0D%0A%0D%0AYou can verify this certificate at: ${window.location.origin}/verify-certificate/${certificateData.referenceNumber}%0D%0A%0D%0ABest regards,%0D%0A${certificateData.promoterName}`;

      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailtoLink);
      
      toast.success("Enhanced email template opened!");
    } catch (error) {
      console.error('Enhanced email failed:', error);
      toast.error("Failed to open enhanced email");
    }
  };

  return {
    generateCertificate,
    certificateData,
    loading,
    downloading,
    sharing,
    availableShifts,
    fetchPromoters,
    handleDownload,
    handleShare,
    handleEmail
  };
};