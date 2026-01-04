
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PromoterOption } from "../types/PromoterTypes";

export default function usePromoters() {
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);

  const fetchPromoters = async () => {
    setLoadingPromoters(true);
    try {
      let promoterRows: any[] = [];

      // Try RPC first (if migration has been applied)
      const { data: rpcData, error: rpcError } = await supabase.rpc('list_eligible_promoters').then(
        (result) => result,
        () => ({ data: null, error: new Error('RPC not available') })
      );

      if (rpcData && !rpcError) {
        promoterRows = rpcData;
        console.log('Loaded promoters from RPC');
      } else {
        // Fallback: Direct select for approved promoters
        console.warn('RPC not available, falling back to profiles select');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, unique_code, full_name, age, nationality, phone_number')
          .eq('role', 'promoter')
          .eq('verification_status', 'approved')
          .order('full_name', { ascending: true });

        if (fallbackError) {
          console.error("Error fetching promoters:", fallbackError);
          toast.error("Failed to load promoter list");
          setPromoters([]);
          return;
        }
        promoterRows = fallbackData;
      }

      if (promoterRows && promoterRows.length > 0) {
        const formattedPromoters: PromoterOption[] = promoterRows.map((promoter: any) => ({
          id: promoter.id,
          unique_code: promoter.unique_code,
          full_name: promoter.full_name,
          age: promoter.age,
          nationality: promoter.nationality,
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
      
      // Do not use mock data; show empty list
      setPromoters([]);
    } finally {
      setLoadingPromoters(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPromoters();
  }, []);

  // Realtime updates: refresh when a promoter gets approved or a new approved promoter is inserted
  useEffect(() => {
    const channel = supabase
      .channel('profiles-promoter-approvals')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'role=eq.promoter' },
        (payload) => {
          const newRow: any = payload.new;
          const oldRow: any = payload.old;
          if (newRow?.verification_status === 'approved' && oldRow?.verification_status !== 'approved') {
            fetchPromoters();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles', filter: 'role=eq.promoter' },
        (payload) => {
          const newRow: any = payload.new;
          if (newRow?.verification_status === 'approved') {
            fetchPromoters();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { promoters, loadingPromoters };
}
