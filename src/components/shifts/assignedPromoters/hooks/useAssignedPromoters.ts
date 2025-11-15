
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
          profiles:promoter_id (
            full_name,
            unique_code,
            phone_number
          )
        `)
        .eq("shift_id", shiftId);

      if (error) throw error;

      const formattedPromoters = data?.map((assignment: any) => ({
        id: assignment.id,
        promoter_id: assignment.promoter_id,
        status: assignment.status,
        full_name: assignment.profiles?.full_name || "Unknown",
        unique_code: assignment.profiles?.unique_code || "N/A",
        phone_number: assignment.profiles?.phone_number,
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
