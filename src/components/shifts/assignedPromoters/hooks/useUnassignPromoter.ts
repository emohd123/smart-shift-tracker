import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUnassignPromoter = () => {
  const [loading, setLoading] = useState(false);

  const unassignPromoter = async (
    assignmentId: string,
    promoterId: string,
    promoterName: string,
    hasTimeLogs: boolean
  ) => {
    if (hasTimeLogs) {
      toast.error("Cannot unassign promoter with attendance records");
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('shift_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success(`Unassigned ${promoterName}`);
      return true;
    } catch (error: any) {
      console.error("Error unassigning promoter:", error);
      toast.error("Failed to unassign promoter");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { unassignPromoter, loading };
};
