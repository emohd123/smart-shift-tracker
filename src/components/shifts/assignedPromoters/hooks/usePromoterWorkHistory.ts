import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ShiftSession = {
  timeLogId: string;
  shiftTitle: string;
  checkIn: string;
  checkOut: string | null;
  hours: number;
  earnings: number;
};

type DailyHistory = {
  date: string;
  shifts: ShiftSession[];
  totalHours: number;
  totalEarnings: number;
};

type HistorySummary = {
  totalDays: number;
  totalHours: number;
  totalEarnings: number;
  avgPerDay: number;
};

export const usePromoterWorkHistory = (promoterId: string, dateFrom?: string, dateTo?: string) => {
  const [dailyHistory, setDailyHistory] = useState<DailyHistory[]>([]);
  const [summary, setSummary] = useState<HistorySummary>({
    totalDays: 0,
    totalHours: 0,
    totalEarnings: 0,
    avgPerDay: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!promoterId) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("time_logs")
          .select(`
            id,
            check_in_time,
            check_out_time,
            total_hours,
            earnings,
            shift_id,
            shifts (
              title
            )
          `)
          .eq("user_id", promoterId)
          .order("check_in_time", { ascending: false });

        // Apply date filters if provided
        if (dateFrom) {
          query = query.gte("check_in_time", new Date(dateFrom).toISOString());
        }
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          query = query.lte("check_in_time", endOfDay.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        // Group by date
        const grouped: { [date: string]: ShiftSession[] } = {};
        
        data?.forEach((log: any) => {
          const date = log.check_in_time.split("T")[0];
          if (!grouped[date]) {
            grouped[date] = [];
          }
          
          grouped[date].push({
            timeLogId: log.id,
            shiftTitle: log.shifts?.title || "Unknown Shift",
            checkIn: log.check_in_time,
            checkOut: log.check_out_time,
            hours: log.total_hours || 0,
            earnings: log.earnings || 0,
          });
        });

        // Convert to array and calculate totals
        const historyArray: DailyHistory[] = Object.entries(grouped).map(([date, shifts]) => ({
          date,
          shifts,
          totalHours: shifts.reduce((sum, s) => sum + s.hours, 0),
          totalEarnings: shifts.reduce((sum, s) => sum + s.earnings, 0),
        }));

        setDailyHistory(historyArray);

        // Calculate summary
        const totalHours = historyArray.reduce((sum, day) => sum + day.totalHours, 0);
        const totalEarnings = historyArray.reduce((sum, day) => sum + day.totalEarnings, 0);
        const totalDays = historyArray.length;

        setSummary({
          totalDays,
          totalHours,
          totalEarnings,
          avgPerDay: totalDays > 0 ? totalEarnings / totalDays : 0,
        });
      } catch (error: any) {
        console.error("Error fetching work history:", error);
        toast.error("Failed to load work history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [promoterId, dateFrom, dateTo]);

  return { dailyHistory, summary, loading };
};
