import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAssignPromoters = (shiftId: string) => {
  const [loading, setLoading] = useState(false);

  const assignPromoters = async (
    promoterIds: string[],
    schedules?: { [key: string]: any }
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const assignments = promoterIds.map(promoterId => {
        const schedule = schedules?.[promoterId];
        return {
          shift_id: shiftId,
          promoter_id: promoterId,
          scheduled_start_time: schedule?.startTime || null,
          scheduled_end_time: schedule?.endTime || null,
          auto_checkin_enabled: schedule?.autoCheckIn || false,
          auto_checkout_enabled: schedule?.autoCheckOut || false,
        };
      });

      const { error } = await supabase
        .from("shift_assignments")
        .insert(assignments);

      if (error) throw error;

      toast.success(`Successfully assigned ${promoterIds.length} promoter(s)`);
      return true;
    } catch (error: any) {
      console.error("Error assigning promoters:", error);
      toast.error("Failed to assign promoters");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { assignPromoters, loading };
};
