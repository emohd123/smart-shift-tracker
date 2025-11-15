
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

      if (error) throw error;

      // Group time logs by user_id
      const groupedLogs: { [promoterId: string]: TimeLog[] } = {};
      data?.forEach((log) => {
        if (!groupedLogs[log.user_id]) {
          groupedLogs[log.user_id] = [];
        }
        groupedLogs[log.user_id].push({
          check_in_time: log.check_in_time,
          check_out_time: log.check_out_time,
          total_hours: log.total_hours,
          earnings: log.earnings,
        });
      });

      setTimeLogs(groupedLogs);
    } catch (error: any) {
      console.error("Error fetching time logs:", error);
      toast.error("Failed to load attendance records");
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
