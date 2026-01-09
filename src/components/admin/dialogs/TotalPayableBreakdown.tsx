import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";
import { supabase } from "@/integrations/supabase/client";
import { Download, Search, Building2, User, Calendar, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface TimeLogWithDetails {
  id: string;
  shift_id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  total_hours: number | null;
  earnings: number | null;
  shift?: {
    id: string;
    title: string;
    date: string;
    location: string | null;
    pay_rate: number | null;
    pay_rate_type: string | null;
    company_id: string | null;
    company_name?: string | null;
  };
  promoter?: {
    full_name: string | null;
    unique_code: string | null;
  };
}

interface BreakdownStats {
  totalPayable: number;
  totalHours: number;
  averageHourlyRate: number;
  totalTimeLogs: number;
}

export default function TotalPayableBreakdown({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [timeLogs, setTimeLogs] = useState<TimeLogWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("byShift");

  useEffect(() => {
    if (open) {
      fetchTimeLogs();
    }
  }, [open, dateFrom, dateTo]);

  const fetchTimeLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch time logs first
      let query = supabase
        .from("time_logs")
        .select("id, shift_id, user_id, check_in_time, check_out_time, total_hours, earnings")
        .not("check_out_time", "is", null);

      if (dateFrom) {
        query = query.gte("check_in_time", new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("check_in_time", endDate.toISOString());
      }

      const { data: logsData, error: logsError } = await query.order("check_in_time", { ascending: false });

      if (logsError) throw logsError;

      const logs = logsData || [];
      
      // Fetch shifts separately
      const shiftIds = [...new Set(logs.map(log => log.shift_id))];
      const { data: shiftsData } = await supabase
        .from("shifts")
        .select("id, title, date, location, pay_rate, pay_rate_type, company_id")
        .in("id", shiftIds);

      // Fetch company names
      const companyIds = [...new Set((shiftsData || []).map(s => s.company_id).filter(Boolean))];
      let companyMap = new Map<string, string>();
      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from("profiles")
          .select("id, company_name, full_name")
          .in("id", companyIds);
        
        companies?.forEach(c => {
          companyMap.set(c.id, c.company_name || c.full_name || "Unknown");
        });
      }

      // Fetch promoter names
      const userIds = [...new Set(logs.map(log => log.user_id))];
      const { data: promoters } = await supabase
        .from("profiles")
        .select("id, full_name, unique_code")
        .in("id", userIds);

      const promoterMap = new Map<string, { full_name: string | null; unique_code: string | null }>();
      promoters?.forEach(p => {
        promoterMap.set(p.id, { full_name: p.full_name, unique_code: p.unique_code });
      });

      const shiftMap = new Map((shiftsData || []).map(s => [s.id, s]));

      // Combine data
      const transformedData = logs.map((log) => {
        const shift = shiftMap.get(log.shift_id);
        return {
          ...log,
          shift: shift ? {
            ...shift,
            company_name: shift.company_id ? companyMap.get(shift.company_id) : null,
          } : undefined,
          promoter: promoterMap.get(log.user_id),
        };
      });

      setTimeLogs(transformedData);
    } catch (error) {
      console.error("Error fetching time logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats: BreakdownStats = {
    totalPayable: timeLogs.reduce((sum, log) => {
      const hours = log.total_hours || 0;
      const payRate = log.shift?.pay_rate || 0;
      return sum + (hours * payRate);
    }, 0),
    totalHours: timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0),
    averageHourlyRate: timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0) > 0
      ? timeLogs.reduce((sum, log) => {
          const hours = log.total_hours || 0;
          const payRate = log.shift?.pay_rate || 0;
          return sum + (hours * payRate);
        }, 0) / timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0)
      : 0,
    totalTimeLogs: timeLogs.length,
  };

  const filteredLogs = timeLogs.filter((log) => {
    const matchesSearch = !searchTerm || 
      log.shift?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.promoter?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.promoter?.unique_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.shift?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group by shift
  const byShift = filteredLogs.reduce((acc, log) => {
    if (!log.shift) return acc;
    const shiftId = log.shift_id;
    if (!acc[shiftId]) {
      acc[shiftId] = {
        shift: log.shift,
        logs: [],
        totalHours: 0,
        totalPayable: 0,
      };
    }
    const hours = log.total_hours || 0;
    const payRate = log.shift.pay_rate || 0;
    acc[shiftId].logs.push(log);
    acc[shiftId].totalHours += hours;
    acc[shiftId].totalPayable += hours * payRate;
    return acc;
  }, {} as Record<string, { shift: TimeLogWithDetails["shift"]; logs: TimeLogWithDetails[]; totalHours: number; totalPayable: number }>);

  // Group by promoter
  const byPromoter = filteredLogs.reduce((acc, log) => {
    if (!log.promoter) return acc;
    const promoterId = log.user_id;
    if (!acc[promoterId]) {
      acc[promoterId] = {
        promoter: log.promoter,
        logs: [],
        totalHours: 0,
        totalPayable: 0,
      };
    }
    const hours = log.total_hours || 0;
    const payRate = log.shift?.pay_rate || 0;
    acc[promoterId].logs.push(log);
    acc[promoterId].totalHours += hours;
    acc[promoterId].totalPayable += hours * payRate;
    return acc;
  }, {} as Record<string, { promoter: TimeLogWithDetails["promoter"]; logs: TimeLogWithDetails[]; totalHours: number; totalPayable: number }>);

  // Group by company
  const byCompany = filteredLogs.reduce((acc, log) => {
    if (!log.shift?.company_id) return acc;
    const companyId = log.shift.company_id;
    if (!acc[companyId]) {
      acc[companyId] = {
        company: log.shift.company_name || "Unknown",
        logs: [],
        totalHours: 0,
        totalPayable: 0,
      };
    }
    const hours = log.total_hours || 0;
    const payRate = log.shift.pay_rate || 0;
    acc[companyId].logs.push(log);
    acc[companyId].totalHours += hours;
    acc[companyId].totalPayable += hours * payRate;
    return acc;
  }, {} as Record<string, { company: string; logs: TimeLogWithDetails[]; totalHours: number; totalPayable: number }>);

  // Group by date
  const byDate = filteredLogs.reduce((acc, log) => {
    const dateKey = format(new Date(log.check_in_time), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        logs: [],
        totalHours: 0,
        totalPayable: 0,
      };
    }
    const hours = log.total_hours || 0;
    const payRate = log.shift?.pay_rate || 0;
    acc[dateKey].logs.push(log);
    acc[dateKey].totalHours += hours;
    acc[dateKey].totalPayable += hours * payRate;
    return acc;
  }, {} as Record<string, { date: string; logs: TimeLogWithDetails[]; totalHours: number; totalPayable: number }>);

  const exportData = () => {
    const csv = [
      ["Shift", "Date", "Promoter", "Company", "Hours", "Pay Rate", "Payable"].join(","),
      ...filteredLogs.map(log => [
        log.shift?.title || "N/A",
        log.shift?.date || "N/A",
        log.promoter?.full_name || "N/A",
        log.shift?.company_name || "N/A",
        (log.total_hours || 0).toFixed(2),
        (log.shift?.pay_rate || 0).toFixed(3),
        ((log.total_hours || 0) * (log.shift?.pay_rate || 0)).toFixed(3)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `total-payable-breakdown-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Total Payable Breakdown
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of all payable amounts from time logs
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBHD(stats.totalPayable)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg. Hourly Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBHD(stats.averageHourlyRate)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Time Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTimeLogs}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shifts, promoters, companies..."
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="byShift">By Shift</TabsTrigger>
            <TabsTrigger value="byPromoter">By Promoter</TabsTrigger>
            <TabsTrigger value="byCompany">By Company</TabsTrigger>
            <TabsTrigger value="byDate">By Date</TabsTrigger>
          </TabsList>

          <TabsContent value="byShift" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shift</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Pay Rate</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : Object.values(byShift).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(byShift)
                      .sort((a, b) => new Date(b.shift.date).getTime() - new Date(a.shift.date).getTime())
                      .map((item) => (
                        <TableRow key={item.shift.id}>
                          <TableCell className="font-medium">{item.shift.title}</TableCell>
                          <TableCell>{format(new Date(item.shift.date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{item.shift.company_name || "N/A"}</TableCell>
                          <TableCell>{item.shift.location || "N/A"}</TableCell>
                          <TableCell>
                            {formatBHD(item.shift.pay_rate || 0)}/{item.shift.pay_rate_type || "hr"}
                          </TableCell>
                          <TableCell className="text-right">{item.totalHours.toFixed(2)}h</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatBHD(item.totalPayable)}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="byPromoter" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Promoter</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Shifts</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : Object.values(byPromoter).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(byPromoter)
                      .sort((a, b) => b.totalPayable - a.totalPayable)
                      .map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {item.promoter.full_name || "Unknown"}
                          </TableCell>
                          <TableCell>{item.promoter.unique_code || "N/A"}</TableCell>
                          <TableCell className="text-right">{item.logs.length}</TableCell>
                          <TableCell className="text-right">{item.totalHours.toFixed(2)}h</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatBHD(item.totalPayable)}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="byCompany" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Shifts</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : Object.values(byCompany).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(byCompany)
                      .sort((a, b) => b.totalPayable - a.totalPayable)
                      .map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.company}</TableCell>
                          <TableCell className="text-right">
                            {new Set(item.logs.map(l => l.shift_id)).size}
                          </TableCell>
                          <TableCell className="text-right">{item.totalHours.toFixed(2)}h</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatBHD(item.totalPayable)}
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
                    <TableHead className="text-right">Time Logs</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : Object.values(byDate).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(byDate)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((item) => (
                        <TableRow key={item.date}>
                          <TableCell className="font-medium">
                            {format(new Date(item.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">{item.logs.length}</TableCell>
                          <TableCell className="text-right">{item.totalHours.toFixed(2)}h</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatBHD(item.totalPayable)}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
