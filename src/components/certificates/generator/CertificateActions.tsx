
import { Button } from "@/components/ui/button";
import { Download, Loader2, MailIcon, QrCode, Share2 } from "lucide-react";
import { CertificateData } from "../types/certificate";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type CertificateActionsProps = {
  certificateData: CertificateData | undefined;
  downloading: boolean;
  sharing: boolean;
  isAuthenticated: boolean;
  handleDownload: () => void;
  handleShare: () => void;
  handleEmail: () => void;
};

export default function CertificateActions({
  certificateData,
  downloading,
  sharing,
  isAuthenticated,
  handleDownload,
  handleShare,
  handleEmail
}: CertificateActionsProps) {
  if (!certificateData) return null;

  const handleDownloadWithAuth = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to download certificates");
      return;
    }
    
    // Check if user has subscription (unlimited downloads) or credits
    const { data: subscription } = await supabase.functions.invoke('check-subscription');
    if (subscription?.subscribed) {
      handleDownload();
      return;
    }

    // Check credits and deduct if necessary
    try {
      const { data, error } = await supabase.functions.invoke('use-credits', {
        body: { 
          certificateId: certificateData.referenceNumber, 
          creditsRequired: 25 
        }
      });

      if (error) throw error;

      if (data.success) {
        handleDownload();
        toast.success(`Certificate downloaded! ${data.remainingBalance} credits remaining.`);
      } else {
        toast.error("Insufficient credits. Please purchase more credits or upgrade your subscription.");
      }
    } catch (error) {
      console.error('Credit check failed:', error);
      toast.error("Failed to process download. Please try again.");
    }
  };

  const handleShareWithAuth = () => {
    if (!isAuthenticated) {
      toast.error("Please login to share certificates");
      return;
    }
    handleShare();
  };

  const handleEmailWithAuth = () => {
    if (!isAuthenticated) {
      toast.error("Please login to use email feature");
      return;
    }
    handleEmail();
  };

  const handleViewQR = () => {
    if (!certificateData) {
      toast.error("Certificate data not available");
      return;
    }
    
    const verifyUrl = `/verify-certificate/${certificateData.referenceNumber}`;
    window.open(verifyUrl, '_blank');
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button 
        variant="default" 
        onClick={handleDownloadWithAuth}
        disabled={downloading || !isAuthenticated}
        className="relative overflow-hidden group"
      >
        <span className="absolute inset-0 w-0 bg-white/20 transition-all duration-300 group-hover:w-full"></span>
        {downloading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Download PDF
      </Button>
      
      <Button 
        variant="secondary" 
        onClick={handleShareWithAuth}
        disabled={sharing || !isAuthenticated}
      >
        <Share2 className="mr-2 h-4 w-4" />
        {sharing ? "Sharing..." : "Share"}
      </Button>
      
      <Button 
        variant="outline" 
        onClick={handleEmailWithAuth}
        disabled={!isAuthenticated}
      >
        <MailIcon className="mr-2 h-4 w-4" />
        Email
      </Button>
      
      <Button 
        variant="ghost"
        onClick={handleViewQR}
      >
        <QrCode className="mr-2 h-4 w-4" />
        View QR Code
      </Button>
    </div>
  );
}
