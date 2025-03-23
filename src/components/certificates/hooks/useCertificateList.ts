
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Certificate } from "../types/certificate";

export default function useCertificateList() {
  const { user, isAuthenticated } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // In a real implementation, fetch from the database
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
                pdf_url: null
              },
              {
                id: "2",
                reference_number: "CERT-DEF456",
                issue_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                time_period: "Last 3 Months",
                total_hours: 24,
                pdf_url: null
              },
              {
                id: "3",
                reference_number: "CERT-GHI789",
                issue_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                time_period: "Last 1 Year",
                total_hours: 120,
                pdf_url: null
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
              pdf_url: null
            },
            {
              id: "2",
              reference_number: "CERT-DEF456",
              issue_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              time_period: "Last 3 Months",
              total_hours: 24,
              pdf_url: null
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching certificates:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificates();
  }, [user]);

  const handleDownload = (cert: Certificate) => {
    if (!isAuthenticated) {
      toast.error("Please login to download certificates");
      return;
    }
    
    if (cert.pdf_url) {
      window.open(cert.pdf_url, '_blank');
    } else {
      // For demo purposes, simulate download
      toast.success(`Downloading certificate ${cert.reference_number}...`);
    }
  };
  
  const handleViewDetails = (cert: Certificate) => {
    window.open(`/verify-certificate/${cert.reference_number}`, '_blank');
  };
  
  // Filter certificates by search term and filter type
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cert.time_period.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    formatDateForDisplay
  };
}
