
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TimeLog } from "../../utils/paymentCalculations";

export const usePromoterTimeLogs = (shiftId: string) => {
  const [timeLogs, setTimeLogs] = useState<{ [promoterId: string]: TimeLog[] }>({});
  const [loading, setLoading] = useState(true);

  const fetchTimeLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("time_logs")
        .select("*")
        .eq("shift_id", shiftId);

      if (error) {
        console.error("Error fetching time logs:", error);
        // Don't show error if table is just empty (no records is valid)
        if (error.code !== 'PGRST116' && error.message !== 'JSON object requested, multiple (or no) rows returned') {
          toast.error("Failed to load attendance records", {
            description: error.message || "Please check your permissions"
          });
        }
        setTimeLogs({});
        return;
      }

      // Group time logs by user_id
      const groupedLogs: { [promoterId: string]: TimeLog[] } = {};
      data?.forEach((log) => {
        if (!groupedLogs[log.user_id]) {
          groupedLogs[log.user_id] = [];
        }
        groupedLogs[log.user_id].push({
          id: log.id,
          check_in_time: log.check_in_time,
          check_out_time: log.check_out_time,
          total_hours: log.total_hours,
          earnings: log.earnings,
        });
      });

      setTimeLogs(groupedLogs);
    } catch (error: any) {
      console.error("Error fetching time logs:", error);
      // Only show error if it's not just an empty result
      if (error?.code !== 'PGRST116') {
        toast.error("Failed to load attendance records", {
          description: error?.message || "An unexpected error occurred"
        });
      }
      setTimeLogs({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeLogs();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`time_logs_${shiftId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_logs",
          filter: `shift_id=eq.${shiftId}`,
        },
        () => {
          fetchTimeLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shiftId]);

  return { timeLogs, loading, refetch: fetchTimeLogs };
};
