
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Download, ExternalLink, CreditCard, CheckCircle2 } from "lucide-react";
import { Certificate } from "../types/certificate";
import { useCertificatePayment } from "@/hooks/useCertificatePayment";

type CertificateItemProps = {
  cert: Certificate;
  index: number;
  isAuthenticated: boolean;
  handleDownload: (cert: Certificate) => void;
  handleViewDetails: (cert: Certificate) => void;
  formatDateForDisplay: (dateString: string) => string;
};

export default function CertificateItem({
  cert,
  index,
  isAuthenticated,
  handleDownload,
  handleViewDetails,
  formatDateForDisplay,
}: CertificateItemProps) {
  const { initiateCertificatePayment, isProcessing } = useCertificatePayment();
  
  const handlePaymentClick = () => {
    initiateCertificatePayment(cert.id);
  };

  const isPaid = cert.paid === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="border rounded-lg p-4 sm:p-5 hover:bg-secondary/30 transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-base sm:text-lg">{cert.reference_number}</h3>
            <Badge variant="outline" className="text-xs px-2.5 py-1 min-h-[24px]">{cert.time_period}</Badge>
            {isPaid ? (
              <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs px-2.5 py-1 min-h-[24px]">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Paid
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs px-2.5 py-1 min-h-[24px]">
                <CreditCard className="h-3.5 w-3.5 mr-1" />
                Unpaid
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Issued: {formatDateForDisplay(cert.issue_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
              <span><span className="font-semibold">{cert.total_hours}</span> total hours</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {isPaid ? (
            <>
              <Button 
                variant="default" 
                size="default"
                onClick={() => handleDownload(cert)}
                className="flex-1 sm:flex-none text-sm min-w-[120px]"
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Download PDF</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="default"
                onClick={() => handleViewDetails(cert)}
                className="flex-1 sm:flex-none text-sm min-w-[100px]"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>View Details</span>
              </Button>
            </>
          ) : (
            <Button 
              variant="default" 
              size="default"
              onClick={handlePaymentClick}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 text-sm font-semibold min-w-[140px]"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>{isProcessing ? "Processing..." : "Pay $4.99"}</span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
