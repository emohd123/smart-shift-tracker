
import { motion } from "framer-motion";
import { Certificate } from "../types/certificate";
import CertificateItem from "./CertificateItem";

type CertificatesListProps = {
  certificates: Certificate[];
  isAuthenticated: boolean;
  handleDownload: (cert: Certificate) => void;
  handleViewDetails: (cert: Certificate) => void;
  formatDateForDisplay: (dateString: string) => string;
};

export default function CertificatesList({
  certificates,
  isAuthenticated,
  handleDownload,
  handleViewDetails,
  formatDateForDisplay,
}: CertificatesListProps) {
  if (certificates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {certificates.map((cert, index) => (
        <CertificateItem
          key={cert.id}
          cert={cert}
          index={index}
          isAuthenticated={isAuthenticated}
          handleDownload={handleDownload}
          handleViewDetails={handleViewDetails}
          formatDateForDisplay={formatDateForDisplay}
        />
      ))}
    </div>
  );
}
