import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Certificate } from "../types/certificate";

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

  // Mock download handler
  const handleDownload = async (certificate: Certificate) => {
    console.log("Download certificate:", certificate.reference_number);
  };

  // Mock view details handler
  const handleViewDetails = (certificate: Certificate) => {
    console.log("View details:", certificate.reference_number);
  };

  // Mock date formatter
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