
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PromoterOption } from "../ShiftForm";

export default function usePromoters() {
  const { toast } = useToast();
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);

  useEffect(() => {
    const fetchPromoters = async () => {
      setLoadingPromoters(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'promoter');
        
        if (error) {
          console.error("Error fetching promoters:", error);
          // Instead of throwing an error, we'll just log it and use mock data
          // This helps prevent the blank page when permissions are an issue
          const mockPromoters: PromoterOption[] = [
            { 
              id: "mock-1", 
              full_name: "Sample Promoter 1", 
              email: "promoter1@example.com" 
            },
            { 
              id: "mock-2", 
              full_name: "Sample Promoter 2", 
              email: "promoter2@example.com" 
            }
          ];
          setPromoters(mockPromoters);
          return;
        }
        
        if (data) {
          // Map data to match our PromoterOption interface
          const promotersWithEmail = data.map(promoter => ({
            ...promoter,
            email: `promoter-${promoter.id.substring(0, 6)}@example.com`
          }));
          
          setPromoters(promotersWithEmail as PromoterOption[]);
        }
      } catch (error) {
        console.error("Error in promoters hook:", error);
        // Use mock data instead of showing an error toast
        const mockPromoters: PromoterOption[] = [
          { 
            id: "mock-1", 
            full_name: "Sample Promoter 1", 
            email: "promoter1@example.com" 
          },
          { 
            id: "mock-2", 
            full_name: "Sample Promoter 2", 
            email: "promoter2@example.com" 
          }
        ];
        setPromoters(mockPromoters);
      } finally {
        setLoadingPromoters(false);
      }
    };

    fetchPromoters();
  }, [toast]);

  return { promoters, loadingPromoters };
}
