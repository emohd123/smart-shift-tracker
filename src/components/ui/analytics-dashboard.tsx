import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Users, Clock, DollarSign, Activity } from "lucide-react";

interface AnalyticsData {
  timeRange: string;
  shifts: number;
  hours: number;
  revenue: number;
  activeUsers: number;
}

interface UserEngagementData {
  date: string;
  logins: number;
  timeTracking: number;
  certificates: number;
}

interface RevenueBreakdown {
  source: string;
  amount: number;
  color: string;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(false);

  // No mock data; initialize empty. Hook this to API when available
  const analyticsData: AnalyticsData[] = [];

  const userEngagementData: UserEngagementData[] = [];

  const revenueBreakdown: RevenueBreakdown[] = [];

  const hasData = analyticsData.length >= 2;
  const currentData = hasData ? analyticsData[analyticsData.length - 1] : { timeRange: "", shifts: 0, hours: 0, revenue: 0, activeUsers: 0 };
  const previousData = hasData ? analyticsData[analyticsData.length - 2] : currentData;

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change: number;
    icon: React.ReactNode;
    format?: "number" | "currency" | "percentage";
  }> = ({ title, value, change, icon, format = "number" }) => {
    const isPositive = change >= 0;
    const formattedValue = format === "currency" ? `$${value}` : value;

    return (
      <Card className="hover-scale">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            <span className={isPositive ? "text-green-500" : "text-red-500"}>
              {isPositive ? "+" : ""}{change}%
            </span>
            <span className="ml-1">from last period</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your platform's performance and growth</p>
        </div>
        <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <TabsList>
            <TabsTrigger value="7d">7 days</TabsTrigger>
            <TabsTrigger value="30d">30 days</TabsTrigger>
            <TabsTrigger value="90d">90 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Shifts"
          value={currentData.shifts}
          change={calculateGrowth(currentData.shifts, previousData.shifts)}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Hours Tracked"
          value={currentData.hours}
          change={calculateGrowth(currentData.hours, previousData.hours)}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Revenue"
          value={currentData.revenue}
          change={calculateGrowth(currentData.revenue, previousData.revenue)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          format="currency"
        />
        <MetricCard
          title="Active Users"
          value={currentData.activeUsers}
          change={calculateGrowth(currentData.activeUsers, previousData.activeUsers)}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Weekly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeRange" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>Daily user activity metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userEngagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="logins" fill="#8884d8" />
                <Bar dataKey="timeTracking" fill="#82ca9d" />
                <Bar dataKey="certificates" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Shifts vs Hours</CardTitle>
            <CardDescription>Correlation between shifts scheduled and hours worked</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeRange" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="shifts" fill="#8884d8" name="Shifts" />
                <Bar dataKey="hours" fill="#82ca9d" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
            <CardDescription>Breakdown by revenue stream</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ source, amount }) => `${source}: $${amount}`}
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>AI-powered recommendations for growth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">High Engagement Period</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Thursday shows 25% higher user activity. Consider scheduling more shifts on this day.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">Training Opportunity</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Certificate generation is up 45%. Consider launching advanced training modules.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-orange-700 dark:text-orange-300">Revenue Optimization</p>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Subscription revenue is growing steadily. Consider introducing premium tiers.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};