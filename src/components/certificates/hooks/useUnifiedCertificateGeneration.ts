import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CertificateType, TimePeriod, CertificateData, WorkExperienceData } from "../types/certificate";
// Removed dependency on useCertificateGeneration
import { useWorkExperienceData } from "./useWorkExperienceData";
import { generateEnhancedWorkExperiencePDF } from "../utils/enhancedPdfGenerator";
import { useUserData } from "./useShiftData";

export const useUnifiedCertificateGeneration = (
  userId: string, 
  timePeriod: TimePeriod,
  certificateType: CertificateType
) => {
  const { user } = useAuth();
  const [certificateData, setCertificateData] = useState<CertificateData | WorkExperienceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Hooks for certificate data
  const { fetchWorkExperienceData } = useWorkExperienceData();
  const { fetchPromoters } = useUserData();

  const generateCertificate = async (): Promise<{ certificateId: string | null } | void> => {
    if (!user) {
      toast.error("Please login to generate certificates");
      return;
    }

    setLoading(true);
    setCertificateData(null);

    try {
      // Generate work experience certificate (unified for both types)
      const workData = await fetchWorkExperienceData(userId, timePeriod);
      if (workData) {
        setCertificateData(workData);
        // Save certificate to database and get the ID
        const certificateId = await saveCertificateToDatabase(workData);
        return { certificateId };
      }
    } catch (error) {
      console.error('Certificate generation failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveCertificateToDatabase = async (data: WorkExperienceData): Promise<string | null> => {
    try {
      const { data: certData, error } = await supabase
        .from('certificates')
        .insert([{
          user_id: userId,
          certificate_type: 'work_experience',
          reference_number: data.referenceNumber,
          issue_date: new Date().toISOString().split('T')[0],
          total_hours: data.totalHours,
          position_title: 'Multiple Positions',
          time_period: timePeriod,
          promotion_names: data.roles,
          skills_gained: ['Time Management', 'Reliability', 'Customer Service', 'Adaptability'],
          issued_by: user?.id,
          status: 'approved',
          paid: false
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error saving certificate:', error);
        toast.error("Certificate generated but not saved to database");
        return null;
      }
      
      return certData?.id || null;
    } catch (error) {
      console.error('Error saving certificate:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    if (!certificateData) {
      toast.error("No certificate data available");
      return;
    }

    setDownloading(true);
    try {
      let pdfBlob: Blob;
      
      if (certificateType === "skills") {
        pdfBlob = await generateEnhancedWorkExperiencePDF(certificateData as unknown as WorkExperienceData);
      } else {
        pdfBlob = await generateEnhancedWorkExperiencePDF(certificateData as WorkExperienceData);
      }

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificateType}_certificate_${certificateData.referenceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Certificate downloaded successfully!");
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("Failed to download certificate");
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
      const shareText = certificateType === "skills" 
        ? `I've earned a professional skills certificate! Reference: ${certificateData.referenceNumber}`
        : `My comprehensive work experience certificate is ready! Total hours: ${(certificateData as WorkExperienceData).totalHours}. Reference: ${certificateData.referenceNumber}`;
      
      const shareUrl = `${window.location.origin}/verify-certificate/${certificateData.referenceNumber}`;

      if (navigator.share) {
        await navigator.share({
          title: `${certificateType === "skills" ? "Skills" : "Work Experience"} Certificate`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\nVerify at: ${shareUrl}`);
        toast.success("Certificate details copied to clipboard!");
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      toast.error("Failed to share certificate");
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
      const subject = `${certificateType === "skills" ? "Skills" : "Work Experience"} Certificate - ${certificateData.promoterName}`;
      const body = certificateType === "skills"
        ? `Dear Hiring Manager,%0D%0A%0D%0AI am pleased to share my professional skills certificate (Reference: ${certificateData.referenceNumber}).%0D%0A%0D%0AThis certificate validates my experience and competencies in the roles I have undertaken.%0D%0A%0D%0AYou can verify this certificate at: ${window.location.origin}/verify-certificate/${certificateData.referenceNumber}%0D%0A%0D%0ABest regards,%0D%0A${certificateData.promoterName}`
        : `Dear Hiring Manager,%0D%0A%0D%0AI am pleased to share my comprehensive work experience certificate (Reference: ${certificateData.referenceNumber}).%0D%0A%0D%0AWork Summary:%0D%0A- Total Hours: ${(certificateData as WorkExperienceData).totalHours} hours%0D%0A- Total Shifts: ${(certificateData as WorkExperienceData).totalShifts} shifts%0D%0A- Work Period: ${(certificateData as WorkExperienceData).workPeriod.startDate} to ${(certificateData as WorkExperienceData).workPeriod.endDate}%0D%0A- Performance Rating: ${certificateData.performanceRating}/5%0D%0A%0D%0AYou can verify this certificate at: ${window.location.origin}/verify-certificate/${certificateData.referenceNumber}%0D%0A%0D%0ABest regards,%0D%0A${certificateData.promoterName}`;

      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailtoLink);
      
      toast.success("Email template opened!");
    } catch (error) {
      console.error('Email failed:', error);
      toast.error("Failed to open email");
    }
  };

  return {
    generateCertificate,
    certificateData,
    loading,
    downloading,
    sharing,
    handleDownload,
    handleShare,
    handleEmail,
    fetchPromoters
  };
};