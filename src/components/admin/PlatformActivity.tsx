import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityStats {
  totalShifts: number;
  activeShiftsToday: number;
  hoursTrackedToday: number;
  completedShiftsThisWeek: number;
}

export default function PlatformActivity() {
  const [stats, setStats] = useState<ActivityStats>({
    totalShifts: 0,
    activeShiftsToday: 0,
    hoursTrackedToday: 0,
    completedShiftsThisWeek: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityStats();
  }, []);

  const fetchActivityStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get total shifts
      const { count: totalShifts, error: shiftsError } = await supabase
        .from("shifts")
        .select("*", { count: 'exact', head: true });

      if (shiftsError) throw shiftsError;

      // Get active shifts today
      const { data: todayShifts, error: todayError } = await supabase
        .from("shifts")
        .select("id, status, manual_status_override, override_status")
        .eq("date", today);

      if (todayError) throw todayError;

      const activeShiftsToday = todayShifts?.filter(s => {
        const effectiveStatus = s.manual_status_override ? s.override_status : s.status;
        return effectiveStatus === 'ongoing';
      }).length || 0;

      // Get hours tracked today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: todayLogs, error: logsError } = await supabase
        .from("time_logs")
        .select("total_hours")
        .gte("check_in_time", todayStart.toISOString());

      if (logsError) throw logsError;

      const hoursTrackedToday = todayLogs?.reduce((sum, log) => sum + (log.total_hours || 0), 0) || 0;

      // Get completed shifts this week
      const { count: completedThisWeek, error: weekError } = await supabase
        .from("shifts")
        .select("*", { count: 'exact', head: true })
        .eq("status", "completed")
        .gte("date", oneWeekAgo.toISOString().split('T')[0]);

      if (weekError) throw weekError;

      setStats({
        totalShifts: totalShifts || 0,
        activeShiftsToday,
        hoursTrackedToday,
        completedShiftsThisWeek: completedThisWeek || 0
      });
    } catch (error) {
      console.error("Error fetching activity stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Shifts",
      value: stats.totalShifts,
      icon: Calendar,
      color: "text-blue-500"
    },
    {
      title: "Active Today",
      value: stats.activeShiftsToday,
      icon: Activity,
      color: "text-green-500"
    },
    {
      title: "Hours Today",
      value: `${stats.hoursTrackedToday.toFixed(1)}h`,
      icon: Clock,
      color: "text-purple-500"
    },
    {
      title: "Completed (Week)",
      value: stats.completedShiftsThisWeek,
      icon: CheckCircle,
      color: "text-orange-500"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Platform Activity</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
