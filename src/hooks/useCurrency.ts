import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, getCurrency } from "@/components/shifts/utils/currencyUtils";

/**
 * Hook to get user's currency based on their nationality
 * Provides dynamic currency formatting throughout the app
 */
export function useCurrency() {
  const { user } = useAuth();
  const [nationality, setNationality] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNationality = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('nationality')
          .eq('id', user.id)
          .single();
        
        setNationality(data?.nationality || null);
      } catch (error) {
        console.error('Error fetching nationality:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNationality();
  }, [user?.id]);
  
  const format = (amount: number) => formatCurrency(amount, nationality);
  const currency = getCurrency(nationality);
  
  return { format, currency, nationality, loading };
}
