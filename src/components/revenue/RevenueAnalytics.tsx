import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, Download, BookOpen, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type RevenueStats = {
  totalCreditsUsed: number;
  certificateDownloads: number;
  trainingEnrollments: number;
  subscriptionRevenue: number;
  creditRevenue: number;
};

export default function RevenueAnalytics() {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<RevenueStats>({
    totalCreditsUsed: 0,
    certificateDownloads: 0,
    trainingEnrollments: 0,
    subscriptionRevenue: 0,
    creditRevenue: 0
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchRevenueStats();
    }
  }, [isAuthenticated, user]);

  const fetchRevenueStats = async () => {
    try {
      // Get credit usage statistics
      const { data: creditStats } = await supabase
        .from("credit_transactions")
        .select("amount, transaction_type")
        .eq("transaction_type", "usage");

      const totalCreditsUsed = creditStats?.reduce((sum, transaction) => 
        sum + Math.abs(transaction.amount), 0) || 0;

      // Get certificate download stats
      const { data: certStats } = await supabase
        .from("credit_transactions")
        .select("*")
        .like("description", "Certificate download%");

      // Get training enrollment stats
      const { data: trainingStats } = await supabase
        .from("user_module_progress")
        .select("id");

      // Get subscription stats
      const { data: subStats } = await supabase
        .from("subscribers")
        .select("subscribed, subscription_tier")
        .eq("subscribed", true);

      setStats({
        totalCreditsUsed,
        certificateDownloads: certStats?.length || 0,
        trainingEnrollments: trainingStats?.length || 0,
        subscriptionRevenue: (subStats?.length || 0) * 19.99, // Simplified calculation
        creditRevenue: totalCreditsUsed * 0.10 // Rough estimate: 10 cents per credit
      });

    } catch (error) {
      console.error("Error fetching revenue stats:", error);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Admin access required to view revenue analytics.</p>
      </div>
    );
  }

  const totalRevenue = stats.subscriptionRevenue + stats.creditRevenue;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Revenue Analytics</h2>
        <p className="text-muted-foreground">
          Track revenue streams and user engagement metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Combined subscription + credit sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreditsUsed}</div>
            <p className="text-xs text-muted-foreground">
              Total credits consumed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificate Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificateDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Paid certificate downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Enrollments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trainingEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Users enrolled in training
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue by source</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500">Subscriptions</Badge>
                <span>Monthly recurring</span>
              </div>
              <span className="font-semibold">${stats.subscriptionRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Credits</Badge>
                <span>Pay-per-use</span>
              </div>
              <span className="font-semibold">${stats.creditRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>User activity and conversion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Avg. Credits per Download</span>
              <Badge variant="outline">
                {stats.certificateDownloads > 0 ? 
                  Math.round(stats.totalCreditsUsed / stats.certificateDownloads) : 0
                }
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Training Conversion Rate</span>
              <Badge variant="outline">
                {stats.totalCreditsUsed > 0 ? 
                  Math.round((stats.trainingEnrollments / stats.totalCreditsUsed) * 100) : 0
                }%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}