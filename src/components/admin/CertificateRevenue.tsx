import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, DollarSign, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CertificateStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  paidCertificates: number;
  pendingCertificates: number;
  totalVerifications: number;
}

export default function CertificateRevenue() {
  const [stats, setStats] = useState<CertificateStats>({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    paidCertificates: 0,
    pendingCertificates: 0,
    totalVerifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificateStats();
  }, []);

  const fetchCertificateStats = async () => {
    try {
      // Get certificate payments
      const { data: payments, error: paymentsError } = await supabase
        .from("certificate_payments")
        .select("amount, status, created_at");

      if (paymentsError) throw paymentsError;

      // Get certificate verifications count
      const { count: verificationsCount, error: verError } = await supabase
        .from("certificate_verifications")
        .select("*", { count: 'exact', head: true });

      if (verError) throw verError;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const paidPayments = payments?.filter(p => p.status === 'completed') || [];
      const pendingPayments = payments?.filter(p => p.status === 'pending') || [];

      const totalRevenue = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const thisMonthRevenue = paidPayments
        .filter(p => {
          const date = new Date(p.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalRevenue,
        thisMonthRevenue,
        paidCertificates: paidPayments.length,
        pendingCertificates: pendingPayments.length,
        totalVerifications: verificationsCount || 0
      });
    } catch (error) {
      console.error("Error fetching certificate stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Certificate Revenue</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.paidCertificates} certificates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.thisMonthRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Certificate sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Certs</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidCertificates}</div>
            <p className="text-xs text-muted-foreground">
              Completed purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verifications</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVerifications}</div>
            <p className="text-xs text-muted-foreground">
              QR code scans
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Summary</CardTitle>
          <CardDescription>Revenue breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">Paid</Badge>
              <span>Completed</span>
            </div>
            <span className="font-semibold">{stats.paidCertificates} @ $4.99</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Pending</Badge>
              <span>Awaiting payment</span>
            </div>
            <span className="font-semibold">{stats.pendingCertificates}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
