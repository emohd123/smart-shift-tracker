
import { Button } from "@/components/ui/button";
import { Download, Loader2, MailIcon, QrCode, Share2 } from "lucide-react";
import { CertificateData } from "../types/certificate";
import { toast } from "sonner";

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

  const handleDownloadWithAuth = () => {
    if (!isAuthenticated) {
      toast.error("Please login to download certificates");
      return;
    }
    handleDownload();
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center bg-secondary/20 p-6 rounded-b-lg">
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
        onClick={handleShare}
        disabled={sharing || !isAuthenticated}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
      
      <Button 
        variant="outline" 
        onClick={() => isAuthenticated ? handleEmail() : toast.error("Please login to use email feature")}
        disabled={!isAuthenticated}
      >
        <MailIcon className="mr-2 h-4 w-4" />
        Email
      </Button>
      
      <Button 
        variant="ghost"
        onClick={() => certificateData && window.open(`/verify-certificate/${certificateData.referenceNumber}`, '_blank')}
      >
        <QrCode className="mr-2 h-4 w-4" />
        View QR Code
      </Button>
    </div>
  );
}
