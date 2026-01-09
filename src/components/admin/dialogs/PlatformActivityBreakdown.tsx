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
import { Activity, Calendar, Clock, CheckCircle, Search, Download, Building2 } from "lucide-react";
import { format } from "date-fns";
import { getEffectiveStatus } from "@/components/shifts/utils/statusCalculations";

export default function PlatformActivityBreakdown({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [shifts, setShifts] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("shifts");

  useEffect(() => {
    if (open) {
      fetchActivityData();
    }
  }, [open, dateFrom, dateTo]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);

      // Fetch shifts
      let shiftsQuery = supabase
        .from("shifts")
        .select("id, title, date, status, manual_status_override, override_status, company_id");

      if (dateFrom) {
        shiftsQuery = shiftsQuery.gte("date", dateFrom);
      }
      if (dateTo) {
        shiftsQuery = shiftsQuery.lte("date", dateTo);
      }

      const { data: shiftsData, error: shiftsError } = await shiftsQuery.order("date", { ascending: false });

      if (shiftsError) throw shiftsError;

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

      const transformedShifts = (shiftsData || []).map((shift: any) => ({
        ...shift,
        company_name: shift.company_id ? companyMap.get(shift.company_id) : null,
      }));

      setShifts(transformedShifts);

      // Fetch time logs
      let timeLogsQuery = supabase
        .from("time_logs")
        .select("id, check_in_time, total_hours, shift_id")
        .not("check_out_time", "is", null);

      if (dateFrom) {
        timeLogsQuery = timeLogsQuery.gte("check_in_time", new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        timeLogsQuery = timeLogsQuery.lte("check_in_time", endDate.toISOString());
      }

      const { data: timeLogsData, error: timeLogsError } = await timeLogsQuery.order("check_in_time", { ascending: false });

      if (timeLogsError) {
        console.error("Error fetching time logs:", timeLogsError);
      } else {
        // Fetch shift titles for time logs
        const shiftIds = [...new Set((timeLogsData || []).map(log => log.shift_id))];
        const { data: shiftTitles } = await supabase
          .from("shifts")
          .select("id, title")
          .in("id", shiftIds);

        const shiftTitleMap = new Map((shiftTitles || []).map(s => [s.id, s.title]));

        const enrichedTimeLogs = (timeLogsData || []).map((log: any) => ({
          ...log,
          shift_title: shiftTitleMap.get(log.shift_id) || "Unknown",
        }));

        setTimeLogs(enrichedTimeLogs);
      }
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch = !searchTerm ||
      shift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group shifts by status
  const shiftsByStatus = filteredShifts.reduce((acc, shift) => {
    const status = getEffectiveStatus(shift);
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(shift);
    return acc;
  }, {} as Record<string, any[]>);

  // Group time logs by date
  const hoursByDate = timeLogs.reduce((acc, log) => {
    const dateKey = format(new Date(log.check_in_time), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        logs: [],
        totalHours: 0,
      };
    }
    acc[dateKey].logs.push(log);
    acc[dateKey].totalHours += log.total_hours || 0;
    return acc;
  }, {} as Record<string, { date: string; logs: any[]; totalHours: number }>);

  // Group completed shifts by week
  const completedByWeek = filteredShifts
    .filter(s => getEffectiveStatus(s) === 'completed')
    .reduce((acc, shift) => {
      const date = new Date(shift.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = format(weekStart, "yyyy-MM-dd");
      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: weekKey,
          shifts: [],
        };
      }
      acc[weekKey].shifts.push(shift);
      return acc;
    }, {} as Record<string, { week: string; shifts: any[] }>);

  const exportData = (type: string) => {
    let csv: string;
    if (type === 'shifts') {
      csv = [
        ["Shift", "Date", "Company", "Status"].join(","),
        ...filteredShifts.map(shift => [
          shift.title,
          shift.date,
          shift.company_name || "",
          getEffectiveStatus(shift)
        ].join(","))
      ].join("\n");
    } else if (type === 'hours') {
      csv = [
        ["Date", "Shift", "Hours"].join(","),
        ...timeLogs.map(log => [
          format(new Date(log.check_in_time), "yyyy-MM-dd"),
          log.shift_title || "",
          (log.total_hours || 0).toFixed(2)
        ].join(","))
      ].join("\n");
    } else {
      csv = [
        ["Week", "Completed Shifts"].join(","),
        ...Object.values(completedByWeek).map(week => [
          format(new Date(week.week), "MMM dd, yyyy"),
          week.shifts.length.toString()
        ].join(","))
      ].join("\n");
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `platform-activity-${type}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (shift: any) => {
    const status = getEffectiveStatus(shift);
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      ongoing: { variant: "default", label: "Active" },
      upcoming: { variant: "outline", label: "Upcoming" },
      completed: { variant: "secondary", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Platform Activity Breakdown
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of platform activity including shifts and hours tracked
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{shifts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Shifts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0).toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {shiftsByStatus['ongoing']?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active Shifts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {shiftsByStatus['completed']?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shifts..."
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
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
            <TabsTrigger value="hours">Hours Tracked</TabsTrigger>
            <TabsTrigger value="completed">Completed (Week)</TabsTrigger>
          </TabsList>

          <TabsContent value="shifts" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportData('shifts')}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shift</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredShifts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No shifts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.title}</TableCell>
                        <TableCell>{format(new Date(shift.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{shift.company_name || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(shift)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportData('hours')}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time Logs</TableHead>
                    <TableHead className="text-right">Total Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : Object.values(hoursByDate).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No time logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(hoursByDate)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((group) => (
                        <TableRow key={group.date}>
                          <TableCell className="font-medium">
                            {format(new Date(group.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>{group.logs.length}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {group.totalHours.toFixed(2)}h
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => exportData('completed')}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead className="text-right">Completed Shifts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : Object.values(completedByWeek).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                        No completed shifts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(completedByWeek)
                      .sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
                      .map((week) => (
                        <TableRow key={week.week}>
                          <TableCell className="font-medium">
                            Week of {format(new Date(week.week), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {week.shifts.length}
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
