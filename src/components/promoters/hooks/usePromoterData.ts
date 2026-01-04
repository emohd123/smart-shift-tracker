
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PromoterData } from "../types";

export function usePromoterData() {
  const [promoters, setPromoters] = useState<PromoterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPromoters = async () => {
      try {
        setLoading(true);
        
        // Fetch promoters from profiles table in Supabase (only promoter role)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'promoter');
          
        if (profileError) {
          throw profileError;
        }
        
        if (profileData) {
          const promotersData: PromoterData[] = profileData.map(profile => {
            return {
              id: profile.id,
              full_name: profile.full_name,
              phone_number: profile.phone_number || '',
              nationality: profile.nationality || '',
              gender: profile.gender || '',
              verification_status: profile.verification_status || 'pending',
              total_hours: 0,
              total_shifts: 0,
              average_rating: 0,
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
        
        // On error, return empty list to avoid fake data
        setPromoters([]);
        setLoading(false);
      }
    };

    fetchPromoters();
  }, []);

  return {
    promoters,
    loading,
    error
  };
}

