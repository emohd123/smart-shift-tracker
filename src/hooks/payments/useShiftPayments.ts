import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { isCompanyLike } from "@/utils/roleUtils";

export interface ShiftPaymentGroup {
  shift_id: string;
  shift_title: string;
  shift_date: string;
  shift_location: string | null;
  total_amount: number;
  promoter_count: number;
  receipts: Array<{
    id: string;
    receipt_number: string;
    receipt_date: string;
    amount: number;
    promoter_id: string;
    promoter_name: string;
    transaction_reference: string | null;
    pdf_url: string | null;
  }>;
}

export const useShiftPayments = () => {
  const { user, userRole } = useAuth();
  const [shiftPayments, setShiftPayments] = useState<ShiftPaymentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const isCompany = isCompanyLike(userRole);

  useEffect(() => {
    if (user?.id) {
      fetchShiftPayments();
    }
  }, [user?.id, isCompany]);

  const fetchShiftPayments = async () => {
    try {
      setLoading(true);

      // First, fetch all receipts
      let receiptsQuery = supabase
        .from('payment_receipts')
        .select(`
          id,
          receipt_number,
          receipt_date,
          amount,
          shift_id,
          promoter_id,
          transaction_reference,
          pdf_url,
          status,
          shifts!shift_id (
            title,
            date,
            location
          ),
          promoter:promoter_id (
            full_name
          )
        `)
        .eq('status', 'issued')
        .order('receipt_date', { ascending: false });

      if (isCompany) {
        receiptsQuery = receiptsQuery.eq('company_id', user?.id);
      } else {
        receiptsQuery = receiptsQuery.eq('promoter_id', user?.id);
      }

      const { data: receipts, error: receiptsError } = await receiptsQuery;

      if (receiptsError) {
        console.error("Error fetching receipts:", receiptsError);
        throw receiptsError;
      }

      if (!receipts || receipts.length === 0) {
        setShiftPayments([]);
        return;
      }

      // Group receipts by shift_id
      const groupedMap = new Map<string, ShiftPaymentGroup>();

      receipts.forEach((receipt: any) => {
        const shiftId = receipt.shift_id;
        const shift = Array.isArray(receipt.shifts) ? receipt.shifts[0] : receipt.shifts;
        const promoter = Array.isArray(receipt.promoter) ? receipt.promoter[0] : receipt.promoter;

        if (!shiftId || !shift) {
          console.warn("Receipt missing shift data:", receipt.id);
          return;
        }

        if (!groupedMap.has(shiftId)) {
          groupedMap.set(shiftId, {
            shift_id: shiftId,
            shift_title: shift.title || 'Unknown Shift',
            shift_date: shift.date || receipt.receipt_date,
            shift_location: shift.location || null,
            total_amount: 0,
            promoter_count: 0,
            receipts: [],
          });
        }

        const group = groupedMap.get(shiftId)!;
        group.total_amount += parseFloat(receipt.amount) || 0;
        group.receipts.push({
          id: receipt.id,
          receipt_number: receipt.receipt_number,
          receipt_date: receipt.receipt_date,
          amount: parseFloat(receipt.amount) || 0,
          promoter_id: receipt.promoter_id,
          promoter_name: promoter?.full_name || 'Unknown Promoter',
          transaction_reference: receipt.transaction_reference,
          pdf_url: receipt.pdf_url,
        });
      });

      // Calculate unique promoter count per shift
      groupedMap.forEach((group) => {
        const uniquePromoters = new Set(group.receipts.map((r) => r.promoter_id));
        group.promoter_count = uniquePromoters.size;
      });

      // Convert to array and sort by date (most recent first)
      const groupedArray = Array.from(groupedMap.values()).sort((a, b) => {
        return new Date(b.shift_date).getTime() - new Date(a.shift_date).getTime();
      });

      setShiftPayments(groupedArray);
    } catch (error: any) {
      console.error("Error fetching shift payments:", error);
      toast.error(`Failed to load shift payments: ${error.message || 'Unknown error'}`);
      setShiftPayments([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    shiftPayments,
    loading,
    refetch: fetchShiftPayments,
  };
};
