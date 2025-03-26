
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
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch certificates from the database
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false });
        
      if (error) {
        console.error("Error fetching certificates:", error);
        // For demo purposes, show mock data even if there's an error
        setTimeout(() => {
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
          ]);
          setLoading(false);
        }, 1000);
        return;
      }
      
      if (data && data.length > 0) {
        setCertificates(data);
      } else {
        // Demo data if no certificates found
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
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setLoading(false);
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
    
    if (cert.pdf_url) {
      window.open(cert.pdf_url, '_blank');
      toast.success("Opening certificate PDF");
      return;
    }
    
    // If no PDF URL, try to generate one on the fly
    toast.loading("Generating certificate PDF...");
    
    try {
      // Get certificate data
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('reference_number', cert.reference_number)
        .single();
        
      if (error || !data) {
        toast.error("Could not retrieve certificate data");
        return;
      }
      
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.user_id)
        .single();
        
      if (userError || !userData) {
        toast.error("Could not retrieve user data");
        return;
      }
      
      // Create certificate data for PDF generation
      const certificateData = {
        referenceNumber: data.reference_number,
        promoterName: userData.full_name,
        totalHours: data.total_hours,
        positionTitle: data.position_title || "Brand Promoter",
        promotionNames: data.promotion_names || [],
        skillsGained: data.skills_gained || ["Communication", "Customer Service", "Sales", "Event Promotion"],
        shifts: [], // We don't have shift data here
        issueDate: format(new Date(data.issue_date), "MMMM dd, yyyy"),
        managerContact: data.manager_contact || "555-123-4567",
        performanceRating: data.performance_rating || 5
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
      
      toast.success("Certificate downloaded successfully");
    } catch (error) {
      console.error("Error generating certificate:", error);
      toast.error("Failed to generate certificate");
    }
  };
  
  const handleViewDetails = (cert: Certificate) => {
    window.open(`/verify-certificate/${cert.reference_number}`, '_blank');
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
