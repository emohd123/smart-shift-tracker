import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isAdminLike } from "@/utils/roleUtils";

type RevenueStats = {
  totalShiftRevenue: number;
  completedShifts: number;
  totalHoursWorked: number;
  paidAmount: number;
  unpaidAmount: number;
  averageHourlyRate: number;
  thisMonthRevenue: number;
};

export default function RevenueAnalytics() {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<RevenueStats>({
    totalShiftRevenue: 0,
    completedShifts: 0,
    totalHoursWorked: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    averageHourlyRate: 0,
    thisMonthRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && isAdminLike(user?.role)) {
      fetchRevenueStats();
    }
  }, [isAuthenticated, user]);

  const calculateShiftHours = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    
    return diffMinutes / 60;
  };

  const fetchRevenueStats = async () => {
    try {
      setLoading(true);
      
      // Get all completed shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from("shifts")
        .select("*")
        .eq("status", "completed");

      if (shiftsError) throw shiftsError;

      // Get time logs to calculate actual hours
      const { data: timeLogs, error: timeLogsError } = await supabase
        .from("time_logs")
        .select("total_hours, earnings");

      if (timeLogsError) throw timeLogsError;

      // Calculate statistics
      const totalHoursWorked = timeLogs?.reduce((sum, log) => sum + (log.total_hours || 0), 0) || 0;
      const totalEarnings = timeLogs?.reduce((sum, log) => sum + (log.earnings || 0), 0) || 0;

      // Calculate shift-based revenue
      let totalShiftRevenue = 0;
      let paidAmount = 0;
      let unpaidAmount = 0;
      let thisMonthRevenue = 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      shifts?.forEach(shift => {
        const hours = calculateShiftHours(shift.start_time, shift.end_time);
        const revenue = shift.pay_rate * hours;
        totalShiftRevenue += revenue;

        if (shift.is_paid) {
          paidAmount += revenue;
        } else {
          unpaidAmount += revenue;
        }

        const shiftDate = new Date(shift.date);
        if (shiftDate.getMonth() === currentMonth && shiftDate.getFullYear() === currentYear) {
          thisMonthRevenue += revenue;
        }
      });

      const averageHourlyRate = totalHoursWorked > 0 ? totalEarnings / totalHoursWorked : 0;

      setStats({
        totalShiftRevenue,
        completedShifts: shifts?.length || 0,
        totalHoursWorked,
        paidAmount,
        unpaidAmount,
        averageHourlyRate,
        thisMonthRevenue
      });

    } catch (error) {
      console.error("Error fetching revenue stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Admin access required to view revenue analytics.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Revenue Analytics</h2>
        <p className="text-muted-foreground">
          Track shift revenue, payouts, and earnings metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BHD {stats.totalShiftRevenue.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.completedShifts} completed shifts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BHD {stats.thisMonthRevenue.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground">
              Current month revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHoursWorked.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Hours worked across all shifts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hourly Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BHD {stats.averageHourlyRate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Average across all shifts
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Revenue breakdown by payment status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Paid</Badge>
                <span>Completed payments</span>
              </div>
              <span className="font-semibold">BHD {stats.paidAmount.toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500">Unpaid</Badge>
                <span>Pending payments</span>
              </div>
              <span className="font-semibold">BHD {stats.unpaidAmount.toFixed(3)}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">BHD {stats.totalShiftRevenue.toFixed(3)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>Performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Completed Shifts</span>
              <Badge variant="outline">{stats.completedShifts}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Hours Worked</span>
              <Badge variant="outline">{stats.totalHoursWorked.toFixed(1)}h</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment Rate</span>
              <Badge variant="outline">
                {stats.totalShiftRevenue > 0 
                  ? Math.round((stats.paidAmount / stats.totalShiftRevenue) * 100) 
                  : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
