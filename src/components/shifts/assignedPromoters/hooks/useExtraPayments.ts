import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ExtraPayment = {
  id: string;
  shift_assignment_id: string;
  promoter_id: string;
  amount: number;
  type: 'bonus' | 'overtime' | 'extra_task';
  description: string | null;
  created_at: string;
};

export const useExtraPayments = (shiftId: string) => {
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExtraPayments = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('extra_payments')
        .select('id, shift_assignment_id, promoter_id, amount, type, description, created_at')
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching extra payments:', error);
        setExtraPayments([]);
        return;
      }

      setExtraPayments(data || []);
    } catch (err) {
      console.error('Error fetching extra payments:', err);
      setExtraPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtraPayments();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`extra_payments_${shiftId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "extra_payments",
          filter: `shift_id=eq.${shiftId}`,
        },
        () => {
          fetchExtraPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shiftId]);

  // Calculate total extra payments
  const totalExtraPayments = extraPayments.reduce((sum, ep) => sum + (ep.amount || 0), 0);

  // Group by promoter for easy lookup
  const extraPaymentsByPromoter: { [promoterId: string]: ExtraPayment[] } = {};
  extraPayments.forEach((ep) => {
    if (!extraPaymentsByPromoter[ep.promoter_id]) {
      extraPaymentsByPromoter[ep.promoter_id] = [];
    }
    extraPaymentsByPromoter[ep.promoter_id].push(ep);
  });

  return { 
    extraPayments, 
    extraPaymentsByPromoter,
    totalExtraPayments, 
    loading, 
    refetch: fetchExtraPayments 
  };
};

