import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer } from "@/components/admin/shared/ChartContainer";
import { ExportButton } from "@/components/admin/shared/ExportButton";
import { MetricCard } from "@/components/admin/shared/MetricCard";
import { BarChart3, TrendingUp, Clock, Star } from "lucide-react";
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import RatingsTable from "@/components/ratings/RatingsTable";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminReportsTab() {
  const [shiftsData, setShiftsData] = useState<any[]>([]);
  const [timeLogsData, setTimeLogsData] = useState<any[]>([]);
  const [ratingsData, setRatingsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shiftsRes, timeLogsRes, ratingsRes] = await Promise.all([
          supabase.from("shifts").select("*"),
          supabase.from("time_logs").select("*"),
          supabase.from("shift_ratings").select("*"),
        ]);

        setShiftsData(shiftsRes.data || []);
        setTimeLogsData(timeLogsRes.data || []);
        setRatingsData(ratingsRes.data || []);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalShifts = shiftsData.length;
    const totalHours = timeLogsData.reduce((sum, log) => sum + (Number(log.total_hours) || 0), 0);
    const avgRating = ratingsData.length > 0
      ? ratingsData.reduce((sum, r) => sum + Number(r.rating), 0) / ratingsData.length
      : 0;
    const completedShifts = shiftsData.filter(s => s.status === "completed").length;

    return { totalShifts, totalHours, avgRating: avgRating.toFixed(1), completedShifts };
  }, [shiftsData, timeLogsData, ratingsData]);

  // Shifts by month data
  const shiftsByMonth = useMemo(() => {
    const monthCounts: { [key: string]: number } = {};
    shiftsData.forEach(shift => {
      const date = new Date(shift.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .slice(-6); // Last 6 months
  }, [shiftsData]);

  // Shifts by status
  const shiftsByStatus = useMemo(() => {
    const statusCounts: { [key: string]: number } = {};
    shiftsData.forEach(shift => {
      const status = shift.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [shiftsData]);

  // Hours by week
  const hoursByWeek = useMemo(() => {
    const weekHours: { [key: string]: number } = {};
    timeLogsData.forEach(log => {
      const date = new Date(log.check_in_time);
      const weekKey = `Week ${Math.ceil(date.getDate() / 7)}`;
      weekHours[weekKey] = (weekHours[weekKey] || 0) + (Number(log.total_hours) || 0);
    });

    return Object.entries(weekHours)
      .map(([week, hours]) => ({ week, hours: Math.round(hours) }))
      .slice(-4); // Last 4 weeks
  }, [timeLogsData]);

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Shifts"
          value={metrics.totalShifts}
          icon={BarChart3}
          iconClassName="text-blue-600"
        />
        <MetricCard
          title="Completed Shifts"
          value={metrics.completedShifts}
          icon={TrendingUp}
          iconClassName="text-green-600"
        />
        <MetricCard
          title="Total Hours"
          value={Math.round(metrics.totalHours)}
          icon={Clock}
          iconClassName="text-orange-600"
        />
        <MetricCard
          title="Avg. Rating"
          value={metrics.avgRating}
          icon={Star}
          description={`From ${ratingsData.length} ratings`}
          iconClassName="text-yellow-600"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="shifts" className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="promoters">Promoters</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shifts Trend */}
            <ChartContainer title="Shifts Over Time" description="Monthly shift count trend">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={shiftsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} name="Shifts" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Shifts by Status */}
            <ChartContainer title="Shifts by Status" description="Current distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={shiftsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {shiftsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Shift Data</CardTitle>
                <ExportButton
                  data={shiftsData.map(s => ({
                    title: s.title,
                    date: s.date,
                    status: s.status,
                    pay_rate: s.pay_rate,
                    location: s.location,
                  }))}
                  filename="shifts-report"
                />
              </div>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="promoters" className="space-y-4">
          <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
            <div className="text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Promoter Performance</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Coming soon: Promoter attendance rates, completion rates, and performance metrics
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <ChartContainer title="Hours Worked" description="Weekly breakdown of total hours">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hoursByWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#82ca9d" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Time Log Data</CardTitle>
                <ExportButton
                  data={timeLogsData.map(log => ({
                    check_in: log.check_in_time,
                    check_out: log.check_out_time,
                    hours: log.total_hours,
                    earnings: log.earnings,
                  }))}
                  filename="time-logs-report"
                />
              </div>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Shift Ratings</CardTitle>
                <ExportButton
                  data={ratingsData.map(r => ({
                    shift_id: r.shift_id,
                    rating: r.rating,
                    comment: r.comment,
                    created_at: r.created_at,
                  }))}
                  filename="ratings-report"
                />
              </div>
              <CardDescription>All ratings submitted by companies</CardDescription>
            </CardHeader>
            <CardContent>
              <RatingsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
