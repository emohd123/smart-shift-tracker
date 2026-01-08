import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, FileCheck, Clock } from "lucide-react";

interface AnalyticsData {
  totalApprovedShifts: number;
  totalPromotersWithCertificates: number;
  totalVerifications: number;
  recentMonthApprovals: number;
}

export default function CertificateAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalApprovedShifts: 0,
    totalPromotersWithCertificates: 0,
    totalVerifications: 0,
    recentMonthApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total approved shifts for this company
      const { data: shifts } = await supabase
        .from('shifts')
        .select('id')
        .eq('company_id', user.id);

      const shiftIds = shifts?.map(s => s.id) || [];

      // Get total approved assignments
      const { data: approvedAssignments } = await supabase
        .from('shift_assignments')
        .select('promoter_id, work_approved_at')
        .in('shift_id', shiftIds)
        .eq('work_approved', true);

      // Count unique promoters
      const uniquePromoters = new Set(approvedAssignments?.map(a => a.promoter_id) || []);

      // Count recent month approvals
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const recentApprovals = approvedAssignments?.filter(a => 
        a.work_approved_at && new Date(a.work_approved_at) > oneMonthAgo
      ).length || 0;

      // Get verification count from certificates table (approximation)
      const { count: verificationCount } = await supabase
        .from('certificate_verifications')
        .select('*', { count: 'exact', head: true });

      setAnalytics({
        totalApprovedShifts: approvedAssignments?.length || 0,
        totalPromotersWithCertificates: uniquePromoters.size,
        totalVerifications: verificationCount || 0,
        recentMonthApprovals: recentApprovals
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Approved Assignments",
      value: analytics.totalApprovedShifts,
      icon: FileCheck,
      description: "Total certificate approvals"
    },
    {
      title: "Promoters",
      value: analytics.totalPromotersWithCertificates,
      icon: Users,
      description: "With approved work"
    },
    {
      title: "This Month",
      value: analytics.recentMonthApprovals,
      icon: Clock,
      description: "Recent approvals"
    },
    {
      title: "Verifications",
      value: analytics.totalVerifications,
      icon: BarChart3,
      description: "Certificate checks"
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificate Analytics</CardTitle>
          <CardDescription>Loading analytics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Certificate Analytics
        </CardTitle>
        <CardDescription>
          Track certificate issuance and verification metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-secondary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm font-medium">{stat.title}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">About Analytics</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Approved Assignments: Total promoter assignments approved for certificates</li>
            <li>• Promoters: Unique promoters with at least one approved work assignment</li>
            <li>• This Month: Approvals made in the last 30 days</li>
            <li>• Verifications: Times certificates have been verified by third parties</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
