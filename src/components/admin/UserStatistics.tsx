import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Shield, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserStats {
  totalPromoters: number;
  totalCompanies: number;
  totalAdmins: number;
  pendingVerifications: number;
  newThisWeek: number;
}

export default function UserStatistics() {
  const [stats, setStats] = useState<UserStats>({
    totalPromoters: 0,
    totalCompanies: 0,
    totalAdmins: 0,
    pendingVerifications: 0,
    newThisWeek: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      // Get user counts by role
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("role, verification_status, created_at");

      if (profilesError) throw profilesError;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const totalPromoters = profiles?.filter(p => p.role === 'promoter').length || 0;
      const totalCompanies = profiles?.filter(p => p.role === 'company').length || 0;
      const totalAdmins = profiles?.filter(p => p.role === 'admin' || p.role === 'super_admin').length || 0;
      const pendingVerifications = profiles?.filter(p => p.verification_status === 'pending').length || 0;
      const newThisWeek = profiles?.filter(p => 
        new Date(p.created_at) >= oneWeekAgo
      ).length || 0;

      setStats({
        totalPromoters,
        totalCompanies,
        totalAdmins,
        pendingVerifications,
        newThisWeek
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Promoters",
      value: stats.totalPromoters,
      icon: Users,
      color: "text-blue-500"
    },
    {
      title: "Companies",
      value: stats.totalCompanies,
      icon: Building2,
      color: "text-green-500"
    },
    {
      title: "Admins",
      value: stats.totalAdmins,
      icon: Shield,
      color: "text-purple-500"
    },
    {
      title: "Pending Verification",
      value: stats.pendingVerifications,
      icon: Clock,
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">User Statistics</h3>
        <span className="text-sm text-muted-foreground">
          +{stats.newThisWeek} new this week
        </span>
      </div>
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
