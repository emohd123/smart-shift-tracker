import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Clock, 
  Download,
  Building2,
  Award,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isAdminLike } from "@/utils/roleUtils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { format } from "date-fns";

type TimeRange = "7d" | "30d" | "90d" | "all";

type RevenueStats = {
  totalShiftRevenue: number;
  completedShifts: number;
  totalHoursWorked: number;
  paidAmount: number;
  unpaidAmount: number;
  averageHourlyRate: number;
  thisMonthRevenue: number;
  previousPeriodRevenue: number;
  revenueGrowth: number;
  certificateRevenue: number;
  totalRevenue: number;
};

type TimeSeriesData = {
  date: string;
  revenue: number;
  paid: number;
  unpaid: number;
  shifts: number;
};

type CompanyRevenue = {
  companyName: string;
  revenue: number;
  shifts: number;
  hours: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function RevenueAnalytics() {
  const { isAuthenticated, user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [stats, setStats] = useState<RevenueStats>({
    totalShiftRevenue: 0,
    completedShifts: 0,
    totalHoursWorked: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    averageHourlyRate: 0,
    thisMonthRevenue: 0,
    previousPeriodRevenue: 0,
    revenueGrowth: 0,
    certificateRevenue: 0,
    totalRevenue: 0
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [companyRevenue, setCompanyRevenue] = useState<CompanyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && isAdminLike(user?.role)) {
      fetchRevenueStats();
    }
  }, [isAuthenticated, user, timeRange]);

  const calculateShiftHours = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    
    return diffMinutes / 60;
  };

  const getDateRange = (range: TimeRange): { start: Date; end: Date; previousStart: Date; previousEnd: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let start = new Date();
    let previousStart = new Date();
    let previousEnd = new Date();

    switch (range) {
      case "7d":
        start.setDate(end.getDate() - 7);
        previousStart.setDate(start.getDate() - 7);
        previousEnd = new Date(start);
        previousEnd.setHours(23, 59, 59, 999);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        previousStart.setDate(start.getDate() - 30);
        previousEnd = new Date(start);
        previousEnd.setHours(23, 59, 59, 999);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        previousStart.setDate(start.getDate() - 90);
        previousEnd = new Date(start);
        previousEnd.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date(0); // All time
        previousStart = new Date(0);
        previousEnd = new Date(0);
    }

    start.setHours(0, 0, 0, 0);
    previousStart.setHours(0, 0, 0, 0);

    return { start, end, previousStart, previousEnd };
  };

  const fetchRevenueStats = async () => {
    try {
      setLoading(true);
      
      const { start, end, previousStart, previousEnd } = getDateRange(timeRange);
      
      // Build query with date filter
      let shiftsQuery = supabase
        .from("shifts")
        .select("*, profiles!shifts_company_id_fkey(company_name)")
        .eq("status", "completed");

      if (timeRange !== "all") {
        shiftsQuery = shiftsQuery
          .gte("date", start.toISOString().split('T')[0])
          .lte("date", end.toISOString().split('T')[0]);
      }

      const { data: shifts, error: shiftsError } = await shiftsQuery;

      if (shiftsError) throw shiftsError;

      // Get previous period data for comparison
      let previousShiftsQuery = supabase
        .from("shifts")
        .select("*")
        .eq("status", "completed");

      if (timeRange !== "all" && previousEnd > previousStart) {
        previousShiftsQuery = previousShiftsQuery
          .gte("date", previousStart.toISOString().split('T')[0])
          .lte("date", previousEnd.toISOString().split('T')[0]);
      } else {
        previousShiftsQuery = previousShiftsQuery.limit(0);
      }

      const { data: previousShifts } = await previousShiftsQuery;

      // Get time logs
      const { data: timeLogs, error: timeLogsError } = await supabase
        .from("time_logs")
        .select("total_hours, earnings, created_at");

      if (timeLogsError) throw timeLogsError;

      // Get certificate revenue
      let certificateRevenue = 0;
      try {
        const { data: certPayments } = await supabase
          .from("certificate_payments")
          .select("amount, status, created_at")
          .eq("status", "completed");

        if (certPayments && timeRange !== "all") {
          certificateRevenue = certPayments
            .filter(p => {
              const date = new Date(p.created_at);
              return date >= start && date <= end;
            })
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        } else if (certPayments) {
          certificateRevenue = certPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        }
      } catch (err) {
        console.warn("Certificate payments not available:", err);
      }

      // Calculate statistics
      const filteredTimeLogs = timeLogs?.filter(log => {
        if (timeRange === "all") return true;
        const logDate = new Date(log.created_at);
        return logDate >= start && logDate <= end;
      }) || [];

      const totalHoursWorked = filteredTimeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
      const totalEarnings = filteredTimeLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);

      // Calculate shift-based revenue
      let totalShiftRevenue = 0;
      let paidAmount = 0;
      let unpaidAmount = 0;
      const companyRevenueMap = new Map<string, { revenue: number; shifts: number; hours: number }>();
      const timeSeriesMap = new Map<string, { revenue: number; paid: number; unpaid: number; shifts: number }>();

      shifts?.forEach(shift => {
        const hours = calculateShiftHours(shift.start_time, shift.end_time);
        const revenue = (shift.pay_rate || 0) * hours;
        totalShiftRevenue += revenue;

        if (shift.is_paid) {
          paidAmount += revenue;
        } else {
          unpaidAmount += revenue;
        }

        // Company revenue breakdown
        const companyName = (shift.profiles as any)?.company_name || "Unknown";
        const existing = companyRevenueMap.get(companyName) || { revenue: 0, shifts: 0, hours: 0 };
        companyRevenueMap.set(companyName, {
          revenue: existing.revenue + revenue,
          shifts: existing.shifts + 1,
          hours: existing.hours + hours
        });

        // Time series data
        const dateKey = format(new Date(shift.date), "MMM dd");
        const existingDate = timeSeriesMap.get(dateKey) || { revenue: 0, paid: 0, unpaid: 0, shifts: 0 };
        timeSeriesMap.set(dateKey, {
          revenue: existingDate.revenue + revenue,
          paid: existingDate.paid + (shift.is_paid ? revenue : 0),
          unpaid: existingDate.unpaid + (shift.is_paid ? 0 : revenue),
          shifts: existingDate.shifts + 1
        });
      });

      // Previous period revenue
      let previousPeriodRevenue = 0;
      previousShifts?.forEach(shift => {
        const hours = calculateShiftHours(shift.start_time, shift.end_time);
        previousPeriodRevenue += (shift.pay_rate || 0) * hours;
      });

      const revenueGrowth = previousPeriodRevenue > 0 
        ? ((totalShiftRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
        : 0;

      const averageHourlyRate = totalHoursWorked > 0 ? totalEarnings / totalHoursWorked : 0;

      // Convert maps to arrays and sort
      const sortedTimeSeries = Array.from(timeSeriesMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const sortedCompanyRevenue = Array.from(companyRevenueMap.entries())
        .map(([companyName, data]) => ({ companyName, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 companies

      setStats({
        totalShiftRevenue,
        completedShifts: shifts?.length || 0,
        totalHoursWorked,
        paidAmount,
        unpaidAmount,
        averageHourlyRate,
        thisMonthRevenue: totalShiftRevenue, // For current period
        previousPeriodRevenue,
        revenueGrowth,
        certificateRevenue,
        totalRevenue: totalShiftRevenue + certificateRevenue
      });

      setTimeSeriesData(sortedTimeSeries);
      setCompanyRevenue(sortedCompanyRevenue);

    } catch (error) {
      console.error("Error fetching revenue stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const csv = [
      ["Date", "Revenue", "Paid", "Unpaid", "Shifts"].join(","),
      ...timeSeriesData.map(d => 
        [d.date, d.revenue, d.paid, d.unpaid, d.shifts].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-analytics-${timeRange}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    trend, 
    trendLabel 
  }: { 
    title: string; 
    value: string; 
    subtitle?: string; 
    icon: React.ReactNode; 
    trend?: number;
    trendLabel?: string;
  }) => {
    const isPositive = trend !== undefined && trend >= 0;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={isPositive ? "text-green-500" : "text-red-500"}>
                {isPositive ? "+" : ""}{trend.toFixed(1)}%
              </span>
              {trendLabel && <span className="text-muted-foreground ml-1">{trendLabel}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    );
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const paymentStatusData = [
    { name: "Paid", value: stats.paidAmount, color: "#10b981" },
    { name: "Unpaid", value: stats.unpaidAmount, color: "#f97316" }
  ];

  const revenueSourceData = [
    { name: "Shift Revenue", value: stats.totalShiftRevenue, color: "#0088FE" },
    { name: "Certificates", value: stats.certificateRevenue, color: "#00C49F" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Revenue Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive revenue tracking and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`BHD ${stats.totalRevenue.toFixed(3)}`}
          subtitle={`${stats.completedShifts} completed shifts`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={stats.revenueGrowth}
          trendLabel="vs previous period"
        />
        <MetricCard
          title="Shift Revenue"
          value={`BHD ${stats.totalShiftRevenue.toFixed(3)}`}
          subtitle="From completed shifts"
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Certificate Revenue"
          value={`BHD ${stats.certificateRevenue.toFixed(3)}`}
          subtitle="From certificate sales"
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Avg. Hourly Rate"
          value={`BHD ${stats.averageHourlyRate.toFixed(2)}`}
          subtitle={`${stats.totalHoursWorked.toFixed(1)}h worked`}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `BHD ${value.toFixed(3)}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    name="Total Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="paid" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Paid"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="unpaid" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    name="Unpaid"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Revenue breakdown by payment status</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStatusData.some(d => d.value > 0) ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `BHD ${value.toFixed(3)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 pt-4 border-t">
                  {paymentStatusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold">BHD {item.value.toFixed(3)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span>BHD {stats.totalShiftRevenue.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Sources and Company Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
            <CardDescription>Breakdown by revenue stream</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueSourceData.some(d => d.value > 0) ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `BHD ${value.toFixed(3)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 pt-4 border-t">
                  {revenueSourceData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold">BHD {item.value.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Companies by Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Top Companies by Revenue</CardTitle>
            <CardDescription>Revenue breakdown by company</CardDescription>
          </CardHeader>
          <CardContent>
            {companyRevenue.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={companyRevenue.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="companyName" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value: number) => `BHD ${value.toFixed(3)}`} />
                    <Bar dataKey="revenue" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2 pt-4 border-t max-h-32 overflow-y-auto">
                  {companyRevenue.map((company, idx) => (
                    <div key={company.companyName} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{company.companyName}</span>
                        <Badge variant="outline" className="text-xs">
                          {company.shifts} shifts
                        </Badge>
                      </div>
                      <span className="font-semibold">BHD {company.revenue.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No company data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
            <CardDescription>Platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Completed Shifts</span>
              <Badge variant="outline" className="text-base px-3 py-1">
                {stats.completedShifts}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Total Hours Worked</span>
              <Badge variant="outline" className="text-base px-3 py-1">
                {stats.totalHoursWorked.toFixed(1)}h
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment Completion Rate</span>
              <Badge variant="outline" className="text-base px-3 py-1">
                {stats.totalShiftRevenue > 0 
                  ? Math.round((stats.paidAmount / stats.totalShiftRevenue) * 100) 
                  : 0}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Average Revenue per Shift</span>
              <Badge variant="outline" className="text-base px-3 py-1">
                BHD {stats.completedShifts > 0 
                  ? (stats.totalShiftRevenue / stats.completedShifts).toFixed(3) 
                  : "0.000"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Period Comparison</CardTitle>
            <CardDescription>Current vs previous period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Current Period Revenue</span>
              <span className="font-semibold text-lg">BHD {stats.thisMonthRevenue.toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Previous Period Revenue</span>
              <span className="font-semibold text-lg">BHD {stats.previousPeriodRevenue.toFixed(3)}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Growth Rate</span>
                <div className="flex items-center gap-2">
                  {stats.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-semibold text-lg ${stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {stats.revenueGrowth >= 0 ? "+" : ""}{stats.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
