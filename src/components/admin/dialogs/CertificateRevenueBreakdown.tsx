import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Award, DollarSign, Calendar, Search, Download, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface CertificatePayment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user_id?: string;
  user?: {
    full_name: string | null;
    unique_code: string | null;
  };
}

export default function CertificateRevenueBreakdown({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [payments, setPayments] = useState<CertificatePayment[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("byCertificate");

  useEffect(() => {
    if (open) {
      fetchCertificateData();
    }
  }, [open, dateFrom, dateTo]);

  const fetchCertificateData = async () => {
    try {
      setLoading(true);

      // Fetch certificate payments - handle gracefully if table doesn't exist
      let paymentsData: any[] = [];
      let paymentsQuery = supabase
        .from("certificate_payments")
        .select("id, amount, status, created_at, user_id");

      if (dateFrom) {
        paymentsQuery = paymentsQuery.gte("created_at", new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        paymentsQuery = paymentsQuery.lte("created_at", endDate.toISOString());
      }

      const { data, error: paymentsError } = await paymentsQuery.order("created_at", { ascending: false });

      if (paymentsError) {
        // If table doesn't exist, log but don't crash
        if (paymentsError.code === 'PGRST205' || paymentsError.message?.includes('schema cache') || paymentsError.code === '42P01') {
          console.warn("certificate_payments table not found, using empty data");
        } else {
          console.error("Error fetching certificate payments:", paymentsError);
        }
      } else {
        paymentsData = data || [];
      }

      // Fetch user details separately
      const userIds = [...new Set(paymentsData.map(p => p.user_id).filter(Boolean))];
      let userMap = new Map<string, { full_name: string | null; unique_code: string | null }>();
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("profiles")
          .select("id, full_name, unique_code")
          .in("id", userIds);
        
        users?.forEach(u => {
          userMap.set(u.id, { full_name: u.full_name, unique_code: u.unique_code });
        });
      }

      const transformedPayments = paymentsData.map((payment: any) => ({
        id: payment.id,
        amount: Number(payment.amount || 0),
        status: payment.status,
        created_at: payment.created_at,
        user_id: payment.user_id,
        user: payment.user_id ? userMap.get(payment.user_id) : undefined,
      }));

      setPayments(transformedPayments);

      // Fetch verifications - handle gracefully if table doesn't exist
      const { data: verificationsData, error: verificationsError } = await supabase
        .from("certificate_verifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (verificationsError) {
        // If table doesn't exist, log but don't crash
        if (verificationsError.code === 'PGRST205' || verificationsError.message?.includes('schema cache') || verificationsError.code === '42P01') {
          console.warn("certificate_verifications table not found, using empty data");
        } else {
          console.error("Error fetching certificate verifications:", verificationsError);
        }
      } else {
        setVerifications(verificationsData || []);
      }
    } catch (error) {
      console.error("Error fetching certificate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = !searchTerm ||
      payment.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user?.unique_code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const paidPayments = filteredPayments.filter(p => p.status === 'completed');
  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const thisMonthRevenue = paidPayments
    .filter(p => {
      const date = new Date(p.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // Group by date
  const byDate = paidPayments.reduce((acc, payment) => {
    const dateKey = format(new Date(payment.created_at), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        payments: [],
        revenue: 0,
        count: 0,
      };
    }
    acc[dateKey].payments.push(payment);
    acc[dateKey].revenue += payment.amount;
    acc[dateKey].count += 1;
    return acc;
  }, {} as Record<string, { date: string; payments: CertificatePayment[]; revenue: number; count: number }>);

  // Group by status
  const byStatus = {
    paid: {
      payments: paidPayments,
      revenue: totalRevenue,
      count: paidPayments.length,
    },
    pending: {
      payments: pendingPayments,
      revenue: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
      count: pendingPayments.length,
    },
  };

  const exportData = () => {
    const csv = [
      ["Date", "User", "Code", "Amount", "Status"].join(","),
      ...filteredPayments.map(payment => [
        format(new Date(payment.created_at), "yyyy-MM-dd"),
        payment.user?.full_name || "",
        payment.user?.unique_code || "",
        payment.amount.toFixed(2),
        payment.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-revenue-breakdown-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certificate Revenue Breakdown
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of certificate payments and revenue
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">${thisMonthRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{paidPayments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Paid Certificates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{verifications.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Verifications</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="byCertificate">By Certificate</TabsTrigger>
            <TabsTrigger value="byDate">By Date</TabsTrigger>
            <TabsTrigger value="byStatus">By Status</TabsTrigger>
          </TabsList>

          <TabsContent value="byCertificate" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No certificate payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.user?.full_name || "Unknown"}
                        </TableCell>
                        <TableCell>{payment.user?.unique_code || "N/A"}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={payment.status === 'completed' ? 'default' : 'outline'}
                          >
                            {payment.status === 'completed' ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Paid</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> Pending</>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="byDate" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Certificates</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : Object.values(byDate).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No revenue data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(byDate)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((group) => (
                        <TableRow key={group.date}>
                          <TableCell className="font-medium">
                            {format(new Date(group.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">{group.count}</TableCell>
                          <TableCell className="text-right font-semibold">
                            ${group.revenue.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="byStatus" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Paid
                    </h3>
                    <Badge variant="default">{byStatus.paid.count}</Badge>
                  </div>
                  <div className="text-2xl font-bold">${byStatus.paid.revenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Completed payments</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      Pending
                    </h3>
                    <Badge variant="outline">{byStatus.pending.count}</Badge>
                  </div>
                  <div className="text-2xl font-bold">${byStatus.pending.revenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
