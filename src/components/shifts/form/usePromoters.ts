
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
        
        if (error) throw error;
        
        if (data) {
          // Need to add email to match our PromoterOption interface
          const promotersWithEmail = data.map(promoter => ({
            ...promoter,
            email: `promoter-${promoter.id.substring(0, 6)}@example.com`
          }));
          
          setPromoters(promotersWithEmail as PromoterOption[]);
        }
      } catch (error) {
        console.error("Error fetching promoters:", error);
        toast({
          title: "Error",
          description: "Failed to load promoters",
          variant: "destructive"
        });
      } finally {
        setLoadingPromoters(false);
      }
    };

    fetchPromoters();
  }, [toast]);

  return { promoters, loadingPromoters };
}
