import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const useShiftApproval = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const approvePromoterWork = async (
    assignmentId: string,
    promoterName: string,
    shiftId: string
  ) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("shift_assignments")
        .update({
          work_approved: true,
          work_approved_at: new Date().toISOString(),
          work_approved_by: user.id,
        })
        .eq("id", assignmentId);

      if (error) throw error;

      toast.success(`Work approved for ${promoterName}`);
      return true;
    } catch (error: any) {
      console.error("Error approving work:", error);
      toast.error("Failed to approve work");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bulkApprovePromoters = async (
    assignmentIds: string[],
    shiftId: string
  ) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return false;
    }

    if (assignmentIds.length === 0) {
      toast.error("No promoters to approve");
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("shift_assignments")
        .update({
          work_approved: true,
          work_approved_at: new Date().toISOString(),
          work_approved_by: user.id,
        })
        .in("id", assignmentIds);

      if (error) throw error;

      toast.success(`Approved work for ${assignmentIds.length} promoter${assignmentIds.length !== 1 ? 's' : ''}`);
      return true;
    } catch (error: any) {
      console.error("Error bulk approving work:", error);
      toast.error("Failed to approve work");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    approvePromoterWork,
    bulkApprovePromoters,
    loading,
  };
};

