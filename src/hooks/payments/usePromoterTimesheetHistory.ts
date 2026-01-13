import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TimeLogEntry {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  total_hours: number | null;
  earnings: number | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
}

export interface TimesheetSummary {
  total_hours: number;
  total_earnings: number;
  log_count: number;
}

export interface PromoterTimesheetHistory {
  summary: TimesheetSummary;
  logs: TimeLogEntry[];
}

export const usePromoterTimesheetHistory = (shiftId: string | null, promoterId: string | null) => {
  const [timesheetHistory, setTimesheetHistory] = useState<PromoterTimesheetHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shiftId && promoterId) {
      fetchTimesheetHistory();
    } else {
      setTimesheetHistory(null);
    }
  }, [shiftId, promoterId]);

  const fetchTimesheetHistory = async () => {
    if (!shiftId || !promoterId) return;

    try {
      setLoading(true);

      const { data: timeLogs, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('shift_id', shiftId)
        .eq('user_id', promoterId)
        .not('check_out_time', 'is', null)
        .order('check_in_time', { ascending: false });

      if (error) {
        console.error("Error fetching timesheet history:", error);
        throw error;
      }

      const logs: TimeLogEntry[] = (timeLogs || []).map((log) => ({
        id: log.id,
        check_in_time: log.check_in_time,
        check_out_time: log.check_out_time,
        total_hours: log.total_hours,
        earnings: log.earnings,
        check_in_latitude: log.check_in_latitude,
        check_in_longitude: log.check_in_longitude,
        check_out_latitude: log.check_out_latitude,
        check_out_longitude: log.check_out_longitude,
      }));

      // Calculate summary
      const summary: TimesheetSummary = {
        total_hours: logs.reduce((sum, log) => sum + (log.total_hours || 0), 0),
        total_earnings: logs.reduce((sum, log) => sum + (log.earnings || 0), 0),
        log_count: logs.length,
      };

      setTimesheetHistory({
        summary,
        logs,
      });
    } catch (error: any) {
      console.error("Error fetching timesheet history:", error);
      toast.error(`Failed to load timesheet history: ${error.message || 'Unknown error'}`);
      setTimesheetHistory({
        summary: { total_hours: 0, total_earnings: 0, log_count: 0 },
        logs: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    timesheetHistory,
    loading,
    refetch: fetchTimesheetHistory,
  };
};
