import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAssignPromoters = (shiftId: string) => {
  const [loading, setLoading] = useState(false);

  const assignPromoters = async (promoterIds: string[]) => {
    if (promoterIds.length === 0) {
      toast.error("Please select at least one promoter");
      return false;
    }

    setLoading(true);
    try {
      const assignments = promoterIds.map(promoterId => ({
        shift_id: shiftId,
        promoter_id: promoterId,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('shift_assignments')
        .insert(assignments);

      if (error) throw error;

      toast.success(`Assigned ${promoterIds.length} promoter${promoterIds.length > 1 ? 's' : ''}`);
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
