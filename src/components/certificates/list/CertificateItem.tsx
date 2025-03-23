
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Download, ExternalLink } from "lucide-react";
import { Certificate } from "../types/certificate";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="border rounded-lg p-4 hover:bg-secondary/30 transition-colors"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{cert.reference_number}</h3>
            <Badge variant="outline">{cert.time_period}</Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
            <Calendar className="h-3 w-3" />
            Issued: {formatDateForDisplay(cert.issue_date)}
          </div>
          <p className="text-sm mt-2 flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" />
            <span className="font-medium">{cert.total_hours}</span> total hours
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => handleDownload(cert)}
            className="flex-1 sm:flex-none"
            disabled={!isAuthenticated}
          >
            <Download className="mr-1 h-3 w-3" />
            Download
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleViewDetails(cert)}
            className="flex-1 sm:flex-none"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            View Details
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
