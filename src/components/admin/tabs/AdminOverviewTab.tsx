import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import UserStatistics from "@/components/admin/UserStatistics";
import CertificateRevenue from "@/components/admin/CertificateRevenue";
import PlatformActivity from "@/components/admin/PlatformActivity";
import { MetricCard } from "@/components/admin/shared/MetricCard";
import { Calendar, DollarSign, FileDown, Users, Activity, CheckCircle, TrendingUp } from "lucide-react";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import ShiftList from "@/components/shifts/ShiftList";
import { getEffectiveStatus } from "@/components/shifts/utils/statusCalculations";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";
import { supabase } from "@/integrations/supabase/client";

export default function AdminOverviewTab() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [timeLogsLoading, setTimeLogsLoading] = useState(true);

  const { shifts, loading: shiftsLoading } = useShiftsData({
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated,
  });

  // Fetch time logs for accurate payable calculation
  useEffect(() => {
    const fetchTimeLogs = async () => {
      try {
        const { data, error } = await supabase
          .from("time_logs")
          .select("total_hours, earnings, shift_id")
          .not("check_out_time", "is", null);

        if (error) throw error;
        setTimeLogs(data || []);
      } catch (error) {
        console.error("Error fetching time logs:", error);
      } finally {
        setTimeLogsLoading(false);
      }
    };

    fetchTimeLogs();
  }, []);

  const opsStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaysShifts = shifts.filter((s: any) => s.date === today);
    const activeToday = todaysShifts.filter((s: any) => getEffectiveStatus(s) === "ongoing");
    const completedAll = shifts.filter((s: any) => getEffectiveStatus(s) === "completed");

    // Calculate accurate payable from time logs
    const totalPayable = timeLogs.reduce((sum, log) => {
      const hours = Number(log.total_hours || 0);
      const shift = shifts.find((s: any) => s.id === log.shift_id);
      const payRate = Number(shift?.payRate || 0);
      return sum + (hours * payRate);
    }, 0);

    return {
      todaysCount: todaysShifts.length,
      activeCount: activeToday.length,
      completedCount: completedAll.length,
      totalPayable,
    };
  }, [shifts, timeLogs]);

  const quickActions = [
    { label: "Manage Users", icon: Users, path: "/promoters" },
    { label: "View All Shifts", icon: Calendar, path: "/shifts" },
    { label: "Revenue Details", icon: DollarSign, path: "/revenue" },
    { label: "Export Reports", icon: FileDown, path: "/reports" }
  ];

  return (
    <div className="space-y-6">
      {/* Operations Snapshot - Using MetricCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Shifts"
          value={shiftsLoading ? "—" : opsStats.todaysCount}
          icon={Calendar}
          description={`Active now: ${shiftsLoading ? "—" : opsStats.activeCount}`}
        />
        <MetricCard
          title="Completed Shifts"
          value={shiftsLoading ? "—" : opsStats.completedCount}
          icon={CheckCircle}
          description="All-time completed"
        />
        <MetricCard
          title="Total Payable"
          value={timeLogsLoading || shiftsLoading ? "—" : formatBHD(opsStats.totalPayable)}
          icon={DollarSign}
          description="From actual time logs"
          iconClassName="text-green-600"
        />
        <MetricCard
          title="System Status"
          value="Operational"
          icon={Activity}
          description="All services running"
          iconClassName="text-green-600"
        />
      </div>

      {/* User Statistics */}
      <UserStatistics />

      {/* Two-column layout for Certificate Revenue and Platform Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CertificateRevenue />
        <PlatformActivity />
      </div>

      {/* Recent shifts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Shifts</h3>
          <Button variant="outline" size="sm" onClick={() => navigate("/shifts")}>
            View all
          </Button>
        </div>
        <ShiftList shifts={(shifts || []).slice(0, 8)} title="" />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
