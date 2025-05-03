
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
        
        // Fetch promoters from profiles table in Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profileError) {
          throw profileError;
        }
        
        if (profileData) {
          // Transform profiles data into PromoterData format
          const promotersData: PromoterData[] = profileData.map(profile => {
            // Calculate mock stats since we don't have this data yet
            const totalHours = Math.floor(Math.random() * 100);
            const totalShifts = Math.floor(totalHours / 4);
            
            return {
              id: profile.id,
              full_name: profile.full_name,
              phone_number: profile.phone_number || '',
              nationality: profile.nationality || '',
              gender: profile.gender || '',
              verification_status: profile.verification_status || 'pending',
              total_hours: totalHours,
              total_shifts: totalShifts,
              average_rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Random rating between 3-5
              profile_photo_url: profile.profile_photo_url,
              created_at: profile.created_at
            };
          });
          
          setPromoters(promotersData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching promoters:", error);
        setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        toast.error("Failed to load promoters data");
        
        // Fall back to mock data in case of error
        console.log("Falling back to mock data for promoters");
        const mockPromoters: PromoterData[] = [
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
          },
          {
            id: "3",
            full_name: "David Johnson",
            phone_number: "+1122334455",
            nationality: "UK",
            gender: "Male",
            verification_status: "pending",
            total_hours: 24,
            total_shifts: 6,
            average_rating: 4.2,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "4",
            full_name: "Maria Garcia",
            phone_number: "+1777888999",
            nationality: "Spain",
            gender: "Female",
            verification_status: "pending",
            total_hours: 12,
            total_shifts: 3,
            average_rating: 4.0,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "5",
            full_name: "Robert Chen",
            phone_number: "+1555666777",
            nationality: "China",
            gender: "Male",
            verification_status: "rejected",
            total_hours: 0,
            total_shifts: 0,
            average_rating: 0,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "6",
            full_name: "Sarah Williams",
            phone_number: "+1333444555",
            nationality: "Australia",
            gender: "Female",
            verification_status: "approved",
            total_hours: 60,
            total_shifts: 15,
            average_rating: 4.9,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "7",
            full_name: "Michael Brown",
            phone_number: "+1444555666",
            nationality: "USA",
            gender: "Male",
            verification_status: "approved",
            total_hours: 72,
            total_shifts: 18,
            average_rating: 4.7,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "8",
            full_name: "Lisa Anderson",
            phone_number: "+1666777888",
            nationality: "Canada",
            gender: "Female",
            verification_status: "pending",
            total_hours: 8,
            total_shifts: 2,
            average_rating: 3.5,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "9",
            full_name: "James Wilson",
            phone_number: "+1888999000",
            nationality: "UK",
            gender: "Male",
            verification_status: "rejected",
            total_hours: 4,
            total_shifts: 1,
            average_rating: 2.0,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "10",
            full_name: "Emma Martinez",
            phone_number: "+1222333444",
            nationality: "Spain",
            gender: "Female",
            verification_status: "approved",
            total_hours: 40,
            total_shifts: 10,
            average_rating: 4.6,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "11",
            full_name: "Daniel Lee",
            phone_number: "+1999000111",
            nationality: "Korea",
            gender: "Male",
            verification_status: "approved",
            total_hours: 56,
            total_shifts: 14,
            average_rating: 4.3,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "12",
            full_name: "Olivia Taylor",
            phone_number: "+1111222333",
            nationality: "USA",
            gender: "Female",
            verification_status: "pending",
            total_hours: 20,
            total_shifts: 5,
            average_rating: 3.8,
            profile_photo_url: null,
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        setPromoters(mockPromoters);
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
      promoter.verification_status.toLowerCase().includes(searchLower) ||
      promoter.phone_number.toLowerCase().includes(searchLower)
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
