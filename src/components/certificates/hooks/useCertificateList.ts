
import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Certificate } from "../types/certificate";
import { generateCertificatePDF } from "../utils/pdfGenerator";

export default function useCertificateList() {
  const { user, isAuthenticated } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Demo data (used as fallback if DB fetch fails)
      const demoCertificates = [
        {
          id: "1",
          reference_number: "CERT-ABC123",
          issue_date: new Date().toISOString(),
          time_period: "Last 6 Months",
          total_hours: 48,
          pdf_url: null,
          status: "verified",
          promotion_names: ["Product Demo", "Brand Promotion"]
        },
        {
          id: "2",
          reference_number: "CERT-DEF456",
          issue_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          time_period: "Last 3 Months",
          total_hours: 24,
          pdf_url: null,
          status: "verified",
          promotion_names: ["Tech Expo"]
        },
        {
          id: "3",
          reference_number: "CERT-GHI789",
          issue_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          time_period: "Last 1 Year",
          total_hours: 120,
          pdf_url: null,
          status: "verified",
          promotion_names: ["New Product Launch", "Sales Event"]
        }
      ];

      // If user is not authenticated, use demo data
      if (!user) {
        setCertificates(demoCertificates);
        setLoading(false);
        return;
      }
      
      try {
        // Fetch certificates from the database
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', user.id)
          .order('issue_date', { ascending: false });
          
        if (error) {
          console.error("Error fetching certificates:", error);
          setCertificates(demoCertificates);
        } else if (data && data.length > 0) {
          setCertificates(data);
        } else {
          // No certificates found, use demo data
          setCertificates(demoCertificates);
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        setCertificates(demoCertificates);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Unexpected error in fetchCertificates:", error);
      setLoading(false);
      // Set demo data as fallback
      setCertificates([
        {
          id: "1",
          reference_number: "CERT-ABC123",
          issue_date: new Date().toISOString(),
          time_period: "Last 6 Months",
          total_hours: 48,
          pdf_url: null,
          status: "verified",
          promotion_names: ["Product Demo", "Brand Promotion"]
        },
        {
          id: "2",
          reference_number: "CERT-DEF456",
          issue_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          time_period: "Last 3 Months",
          total_hours: 24,
          pdf_url: null,
          status: "verified",
          promotion_names: ["Tech Expo"]
        }
      ]);
    }
  }, [user]);
  
  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleDownload = async (cert: Certificate) => {
    if (!isAuthenticated) {
      toast.error("Please login to download certificates");
      return;
    }
    
    try {
      toast.loading("Generating certificate PDF...");
      
      // Create certificate data for PDF generation
      const certificateData = {
        referenceNumber: cert.reference_number,
        promoterName: user?.user_metadata?.name || "Promoter",
        totalHours: cert.total_hours,
        positionTitle: "Brand Promoter",
        promotionNames: cert.promotion_names || [],
        skillsGained: ["Communication", "Customer Service", "Sales", "Event Promotion"],
        shifts: [], // We don't have shift data here
        issueDate: format(new Date(cert.issue_date), "MMMM dd, yyyy"),
        managerContact: "555-123-4567",
        performanceRating: 5
      };
      
      // Generate PDF
      const pdfBlob = await generateCertificatePDF(certificateData);
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(pdfBlob);
      
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate-${cert.reference_number}.pdf`;
      
      // Click the link to trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success("Certificate downloaded successfully");
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.dismiss();
      toast.error("Failed to generate certificate");
    }
  };
  
  const handleViewDetails = (cert: Certificate) => {
    // Open in same tab to avoid popup blockers
    window.location.href = `/verify-certificate/${cert.reference_number}`;
  };
  
  // Filter certificates by search term and filter type
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cert.time_period.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cert.promotion_names && cert.promotion_names.some(name => 
                            name.toLowerCase().includes(searchTerm.toLowerCase())
                          ));
    
    if (filterType === "all") return matchesSearch;
    if (filterType === "recent" && new Date(cert.issue_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) return matchesSearch;
    if (filterType === "3months" && cert.time_period.includes("3 Months")) return matchesSearch;
    if (filterType === "6months" && cert.time_period.includes("6 Months")) return matchesSearch;
    if (filterType === "1year" && cert.time_period.includes("1 Year")) return matchesSearch;
    
    return false;
  });
  
  const formatDateForDisplay = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return dateString;
    }
  };
  
  const refreshCertificates = () => {
    fetchCertificates();
  };
  
  return {
    certificates,
    filteredCertificates,
    loading,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    isAuthenticated,
    handleDownload,
    handleViewDetails,
    formatDateForDisplay,
    refreshCertificates
  };
}
