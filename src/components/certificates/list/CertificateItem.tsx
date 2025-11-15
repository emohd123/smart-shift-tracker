
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
      className="border rounded-lg p-3 sm:p-4 hover:bg-secondary/30 transition-colors"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
        <div className="w-full sm:flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-sm sm:text-base">{cert.reference_number}</h3>
            <Badge variant="outline" className="text-xs">{cert.time_period}</Badge>
            {isPaid ? (
              <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Paid
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                Unpaid
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm mt-1">
            <Calendar className="h-3 w-3" />
            Issued: {formatDateForDisplay(cert.issue_date)}
          </div>
          <p className="text-xs sm:text-sm mt-2 flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" />
            <span className="font-medium">{cert.total_hours}</span> total hours
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isPaid ? (
            <>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleDownload(cert)}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Download className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Get PDF</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewDetails(cert)}
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                <span className="hidden sm:inline">Details</span>
                <span className="sm:hidden">View</span>
              </Button>
            </>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handlePaymentClick}
              disabled={isProcessing}
              className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/80 text-xs sm:text-sm"
            >
              <CreditCard className="mr-1 h-3 w-3" />
              {isProcessing ? "Processing..." : <><span className="hidden sm:inline">Pay $4.99</span><span className="sm:hidden">$4.99</span></>}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
