
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AssignedPromoter {
  id: string;
  promoter_id: string;
  status: string;
  full_name: string;
  unique_code: string;
  phone_number?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  auto_checkin_enabled?: boolean;
  auto_checkout_enabled?: boolean;
  payment_status?: "scheduled" | "paid" | null;
  payment_scheduled_at?: string | null;
  payment_paid_at?: string | null;
}

export const useAssignedPromoters = (shiftId: string) => {
  const [promoters, setPromoters] = useState<AssignedPromoter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedPromoters = async () => {
    try {
      const { data, error } = await supabase
        .from("shift_assignments")
        .select(`
          id,
          promoter_id,
          status,
          scheduled_start_time,
          scheduled_end_time,
          auto_checkin_enabled,
          auto_checkout_enabled,
          profiles:promoter_id (
            full_name,
            unique_code,
            phone_number
          )
        `)
        .eq("shift_id", shiftId);

      if (error) throw error;

      // Fetch payment status for these assignments (best-effort; table may not exist until migration is applied)
      const assignmentIds = (data || []).map((a: any) => a.id).filter(Boolean);
      let paymentMap = new Map<string, any>();
      if (assignmentIds.length > 0) {
        try {
          const { data: payRows } = await (supabase as any)
            .from("shift_assignment_payment_status")
            .select("assignment_id, status, scheduled_at, paid_at")
            .in("assignment_id", assignmentIds);
          (payRows || []).forEach((p: any) => paymentMap.set(p.assignment_id, p));
        } catch {
          paymentMap = new Map();
        }
      }

      const formattedPromoters = data?.map((assignment: any) => ({
        id: assignment.id,
        promoter_id: assignment.promoter_id,
        status: assignment.status,
        scheduled_start_time: assignment.scheduled_start_time,
        scheduled_end_time: assignment.scheduled_end_time,
        auto_checkin_enabled: assignment.auto_checkin_enabled,
        auto_checkout_enabled: assignment.auto_checkout_enabled,
        full_name: assignment.profiles?.full_name || "Unknown",
        unique_code: assignment.profiles?.unique_code || "N/A",
        phone_number: assignment.profiles?.phone_number,
        payment_status: paymentMap.get(assignment.id)?.status ?? null,
        payment_scheduled_at: paymentMap.get(assignment.id)?.scheduled_at ?? null,
        payment_paid_at: paymentMap.get(assignment.id)?.paid_at ?? null,
      })) || [];

      setPromoters(formattedPromoters);
    } catch (error: any) {
      console.error("Error fetching assigned promoters:", error);
      toast.error("Failed to load assigned promoters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedPromoters();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`shift_assignments_${shiftId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_assignments",
          filter: `shift_id=eq.${shiftId}`,
        },
        () => {
          fetchAssignedPromoters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shiftId]);

  return { promoters, loading, refetch: fetchAssignedPromoters };
};
