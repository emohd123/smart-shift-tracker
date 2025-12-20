import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Certificate } from "../types/certificate";
import { toast } from "sonner";
import { generateMultiCompanyPDF } from "../utils/multiCompanyPdfGenerator";
import type { MultiCompanyCertificate } from "../types/certificate";

export default function useCertificateList() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const fetchCertificates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('paid', true)
        .order('issue_date', { ascending: false });

      if (error) throw error;

      setCertificates(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [user]);

  // Filter certificates based on search and type
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.reference_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || cert.status === filterType;
    return matchesSearch && matchesType;
  });

  const handleDownload = async (certificate: Certificate) => {
    // Prefer regenerating the PDF from stored JSON payload so all downloads use the latest premium layout.
    // Fallback to stored pdf_url for older certificates that don't have structured data.
    try {
      const maybeJson = certificate.time_period;
      if (maybeJson && typeof maybeJson === "string" && maybeJson.trim().startsWith("{")) {
        const stored = JSON.parse(maybeJson);

        if (stored?.companies && Array.isArray(stored.companies) && stored?.promoterName) {
          toast.loading("Preparing certificate...", { id: `dl-${certificate.id}` });

          const certData: MultiCompanyCertificate = {
            referenceNumber: certificate.reference_number,
            promoterName: stored.promoterName,
            issueDate: certificate.issue_date,
            companies: stored.companies,
            grandTotalHours: certificate.total_hours,
            signature: stored.signature || undefined,
          };

          const pdfBlob = await generateMultiCompanyPDF(certData);
          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Certificate-${certificate.reference_number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast.success("Certificate downloaded", { id: `dl-${certificate.id}` });
          return;
        }
      }

      if (certificate.pdf_url) {
        window.open(certificate.pdf_url, "_blank");
        return;
      }

      toast.error("Certificate PDF not available");
    } catch (err) {
      console.error("Certificate download failed:", err);
      // Fallback to stored URL if regen fails
      if (certificate.pdf_url) {
        window.open(certificate.pdf_url, "_blank");
        return;
      }
      toast.error("Failed to download certificate");
    }
  };

  const handleViewDetails = (certificate: Certificate) => {
    // Navigate to certificate detail view if implemented
    console.log("View certificate details:", certificate.reference_number);
  };

  const formatDateForDisplay = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return {
    certificates,
    filteredCertificates,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    setFilterType,
    isAuthenticated: !!user,
    handleDownload,
    handleViewDetails,
    formatDateForDisplay,
    refetch: fetchCertificates
  };
}