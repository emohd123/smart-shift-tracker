import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format, startOfWeek, subWeeks } from "date-fns";

interface MonthlyData {
  month: string;
  earnings: number;
}

interface WeeklyHoursData {
  week: string;
  hours: number;
}

export const useEarningsAnalytics = (userId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [avgHourlyRate, setAvgHourlyRate] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [weeklyHoursData, setWeeklyHoursData] = useState<WeeklyHoursData[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        // Fetch all time logs
        const { data: timeLogs, error } = await supabase
          .from('time_logs')
          .select('check_in_time, total_hours, earnings')
          .eq('user_id', userId)
          .not('check_out_time', 'is', null)
          .order('check_in_time', { ascending: true });

        if (error) throw error;

        if (!timeLogs || timeLogs.length === 0) {
          setLoading(false);
          return;
        }

        // Calculate totals
        const total = timeLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);
        const hours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
        setTotalEarnings(total);
        setTotalHours(hours);
        setAvgHourlyRate(hours > 0 ? total / hours : 0);

        // Calculate this month's earnings
        const currentMonthStart = startOfMonth(new Date());
        const thisMonthLogs = timeLogs.filter(log => 
          new Date(log.check_in_time) >= currentMonthStart
        );
        const monthTotal = thisMonthLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);
        setMonthEarnings(monthTotal);

        // Generate monthly earnings data (last 6 months)
        const monthlyMap = new Map<string, number>();
        for (let i = 5; i >= 0; i--) {
          const month = subMonths(new Date(), i);
          const monthKey = format(month, 'MMM yyyy');
          monthlyMap.set(monthKey, 0);
        }

        timeLogs.forEach(log => {
          const monthKey = format(new Date(log.check_in_time), 'MMM yyyy');
          if (monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, monthlyMap.get(monthKey)! + (log.earnings || 0));
          }
        });

        const monthlyDataArray = Array.from(monthlyMap.entries()).map(([month, earnings]) => ({
          month,
          earnings
        }));
        setMonthlyData(monthlyDataArray);

        // Generate weekly hours data (last 8 weeks)
        const weeklyMap = new Map<string, number>();
        for (let i = 7; i >= 0; i--) {
          const week = subWeeks(new Date(), i);
          const weekStart = startOfWeek(week);
          const weekKey = format(weekStart, 'MMM dd');
          weeklyMap.set(weekKey, 0);
        }

        timeLogs.forEach(log => {
          const weekStart = startOfWeek(new Date(log.check_in_time));
          const weekKey = format(weekStart, 'MMM dd');
          if (weeklyMap.has(weekKey)) {
            weeklyMap.set(weekKey, weeklyMap.get(weekKey)! + (log.total_hours || 0));
          }
        });

        const weeklyDataArray = Array.from(weeklyMap.entries()).map(([week, hours]) => ({
          week,
          hours
        }));
        setWeeklyHoursData(weeklyDataArray);

      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);

  return {
    loading,
    totalEarnings,
    monthEarnings,
    totalHours,
    avgHourlyRate,
    monthlyData,
    weeklyHoursData
  };
};
