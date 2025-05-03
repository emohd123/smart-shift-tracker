
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PromoterOption } from "../types/PromoterTypes";

export default function usePromoters() {
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);

  useEffect(() => {
    const fetchPromoters = async () => {
      setLoadingPromoters(true);
      try {
        // Fetch verified promoters from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone_number')
          .eq('role', 'promoter')
          .eq('verification_status', 'approved');
        
        if (error) {
          console.error("Error fetching promoters:", error);
          toast.error("Failed to load promoter list");
          
          // Use mock data for better user experience during development
          const mockPromoters: PromoterOption[] = [
            { id: "mock-1", full_name: "Sample Promoter 1" },
            { id: "mock-2", full_name: "Sample Promoter 2" },
            { id: "mock-3", full_name: "Sample Promoter 3" }
          ];
          setPromoters(mockPromoters);
          return;
        }
        
        if (data && data.length > 0) {
          // Map promoter profiles to PromoterOption format
          const formattedPromoters: PromoterOption[] = data.map(promoter => ({
            id: promoter.id,
            full_name: promoter.full_name,
            phone_number: promoter.phone_number || ''
          }));
          
          setPromoters(formattedPromoters);
          console.log(`Loaded ${formattedPromoters.length} promoters from database`);
        } else {
          console.log("No promoters found in database");
          setPromoters([]);
        }
      } catch (error) {
        console.error("Error in promoters hook:", error);
        toast.error("Failed to load promoters data");
        
        // Use mock data for better user experience
        const mockPromoters: PromoterOption[] = [
          { id: "mock-1", full_name: "Sample Promoter 1" },
          { id: "mock-2", full_name: "Sample Promoter 2" },
          { id: "mock-3", full_name: "Sample Promoter 3" }
        ];
        setPromoters(mockPromoters);
      } finally {
        setLoadingPromoters(false);
      }
    };

    fetchPromoters();
  }, []);

  return { promoters, loadingPromoters };
}
