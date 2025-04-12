
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PromoterData } from "../types";

export const usePromoters = () => {
  const [promoters, setPromoters] = useState<PromoterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof PromoterData>("full_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchPromoters = async () => {
      try {
        setLoading(true);
        
        // Fetch promoters from profiles table
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'promoter');
          
        if (profilesError) {
          console.error("Error fetching promoters:", profilesError);
          throw profilesError;
        }
        
        // For each promoter, fetch their time logs to calculate total hours
        const promotersWithStats = await Promise.all((profilesData || []).map(async (profile) => {
          try {
            // Fetch time logs for this promoter
            const { data: timeLogs, error: timeLogsError } = await supabase
              .from('time_logs')
              .select('total_hours')
              .eq('user_id', profile.id);
              
            if (timeLogsError) {
              console.error(`Error fetching time logs for promoter ${profile.id}:`, timeLogsError);
              return {
                ...profile,
                total_hours: 0,
                total_shifts: 0,
                average_rating: 0
              } as PromoterData; // Add type assertion here
            }
            
            // Calculate total hours
            const totalHours = timeLogs?.reduce((sum, log) => sum + (log.total_hours || 0), 0) || 0;
            
            // Get certificates for performance rating
            const { data: certificates, error: certificatesError } = await supabase
              .from('certificates')
              .select('performance_rating')
              .eq('user_id', profile.id);
              
            if (certificatesError) {
              console.error(`Error fetching certificates for promoter ${profile.id}:`, certificatesError);
            }
            
            // Calculate average rating from certificates
            const ratings = certificates?.map(cert => cert.performance_rating).filter(Boolean) || [];
            const avgRating = ratings.length > 0 
              ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
              : 0;
              
            // Explicitly convert the profile to PromoterData format
            const promoterData: PromoterData = {
              id: profile.id,
              full_name: profile.full_name,
              phone_number: profile.phone_number,
              nationality: profile.nationality,
              gender: profile.gender,
              verification_status: profile.verification_status,
              profile_photo_url: profile.profile_photo_url,
              created_at: profile.created_at,
              total_hours: totalHours,
              total_shifts: timeLogs?.length || 0,
              average_rating: avgRating
            };
              
            return promoterData;
          } catch (error) {
            console.error(`Error processing data for promoter ${profile.id}:`, error);
            // Return a properly typed object
            return {
              id: profile.id,
              full_name: profile.full_name,
              phone_number: profile.phone_number || '',
              nationality: profile.nationality || '',
              gender: profile.gender || '',
              verification_status: profile.verification_status || '',
              profile_photo_url: profile.profile_photo_url,
              created_at: profile.created_at,
              total_hours: 0,
              total_shifts: 0,
              average_rating: 0
            } as PromoterData;
          }
        }));
        
        setPromoters(promotersWithStats);
      } catch (error) {
        console.error("Error fetching promoters:", error);
        setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        toast.error("Failed to load promoters data");
        
        // Use mock data as fallback for better development experience
        setPromoters([
          {
            id: "1",
            full_name: "John Doe",
            phone_number: "+1234567890",
            nationality: "USA",
            gender: "Male",
            verification_status: "approved",
            total_hours: 48,
            total_shifts: 12,
            average_rating: 4.5,
            profile_photo_url: null,
            created_at: new Date().toISOString()
          },
          {
            id: "2",
            full_name: "Jane Smith",
            phone_number: "+1987654321",
            nationality: "Canada",
            gender: "Female",
            verification_status: "approved",
            total_hours: 36,
            total_shifts: 9,
            average_rating: 4.8,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPromoters();
  }, []);

  // Filter promoters based on search term
  const filteredPromoters = promoters.filter(promoter => {
    const searchLower = searchTerm.toLowerCase();
    return (
      promoter.full_name.toLowerCase().includes(searchLower) ||
      promoter.nationality.toLowerCase().includes(searchLower) ||
      promoter.verification_status.toLowerCase().includes(searchLower)
    );
  });

  // Sort promoters based on selected field
  const sortedPromoters = [...filteredPromoters].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    // Handle numeric values
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const toggleSort = (field: keyof PromoterData) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return {
    promoters: sortedPromoters,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortDirection,
    toggleSort
  };
};
