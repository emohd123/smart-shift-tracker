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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Users, Building2, Search, Download, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface CompletedShift {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  pay_rate: number | null;
  pay_rate_type: string | null;
  company_name?: string | null;
  assignments?: Array<{
    promoter_id: string;
  }>;
  timeLogs?: Array<{
    total_hours: number | null;
    earnings: number | null;
  }>;
}

export default function CompletedShiftsBreakdown({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [shifts, setShifts] = useState<CompletedShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupBy, setGroupBy] = useState<"date" | "company">("date");
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchCompletedShifts();
    }
  }, [open, dateFrom, dateTo]);

  const fetchCompletedShifts = async () => {
    try {
      setLoading(true);

      // Fetch shifts
      let query = supabase
        .from("shifts")
        .select("id, title, date, start_time, end_time, location, pay_rate, pay_rate_type, company_id")
        .eq("status", "completed");

      if (dateFrom) {
        query = query.gte("date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("date", dateTo);
      }

      const { data: shiftsData, error: shiftsError } = await query.order("date", { ascending: false });

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

      // Fetch assignments
      const shiftIds = (shiftsData || []).map(s => s.id);
      const { data: assignments } = await supabase
        .from("shift_assignments")
        .select("shift_id, promoter_id")
        .in("shift_id", shiftIds);

      // Group assignments by shift
      const assignmentsByShift = new Map<string, any[]>();
      assignments?.forEach(a => {
        if (!assignmentsByShift.has(a.shift_id)) {
          assignmentsByShift.set(a.shift_id, []);
        }
        assignmentsByShift.get(a.shift_id)?.push({ promoter_id: a.promoter_id });
      });

      // Fetch time logs
      const { data: timeLogs } = await supabase
        .from("time_logs")
        .select("shift_id, total_hours, earnings")
        .in("shift_id", shiftIds)
        .not("check_out_time", "is", null);

      // Group time logs by shift
      const timeLogsByShift = new Map<string, any[]>();
      timeLogs?.forEach(log => {
        if (!timeLogsByShift.has(log.shift_id)) {
          timeLogsByShift.set(log.shift_id, []);
        }
        timeLogsByShift.get(log.shift_id)?.push({
          total_hours: log.total_hours,
          earnings: log.earnings,
        });
      });

      // Combine data
      const transformedData = (shiftsData || []).map((shift: any) => ({
        id: shift.id,
        title: shift.title,
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        location: shift.location,
        pay_rate: shift.pay_rate,
        pay_rate_type: shift.pay_rate_type,
        company_name: shift.company_id ? companyMap.get(shift.company_id) : null,
        assignments: assignmentsByShift.get(shift.id) || [],
        timeLogs: timeLogsByShift.get(shift.id) || [],
      }));

      setShifts(transformedData);
    } catch (error) {
      console.error("Error fetching completed shifts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch = !searchTerm ||
      shift.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shift.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const calculateShiftTotal = (shift: CompletedShift) => {
    const totalHours = shift.timeLogs?.reduce((sum, log) => sum + (log.total_hours || 0), 0) || 0;
    const totalPayable = shift.timeLogs?.reduce((sum, log) => {
      const hours = log.total_hours || 0;
      const payRate = shift.pay_rate || 0;
      return sum + (hours * payRate);
    }, 0) || 0;
    return { totalHours, totalPayable };
  };

  const groupedByDate = filteredShifts.reduce((acc, shift) => {
    const dateKey = format(new Date(shift.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        shifts: [],
        totalHours: 0,
        totalPayable: 0,
        shiftCount: 0,
      };
    }
    const { totalHours, totalPayable } = calculateShiftTotal(shift);
    acc[dateKey].shifts.push(shift);
    acc[dateKey].totalHours += totalHours;
    acc[dateKey].totalPayable += totalPayable;
    acc[dateKey].shiftCount += 1;
    return acc;
  }, {} as Record<string, { date: string; shifts: CompletedShift[]; totalHours: number; totalPayable: number; shiftCount: number }>);

  const groupedByCompany = filteredShifts.reduce((acc, shift) => {
    const companyId = shift.company_name || "Unknown";
    if (!acc[companyId]) {
      acc[companyId] = {
        company: companyId,
        shifts: [],
        totalHours: 0,
        totalPayable: 0,
        shiftCount: 0,
      };
    }
    const { totalHours, totalPayable } = calculateShiftTotal(shift);
    acc[companyId].shifts.push(shift);
    acc[companyId].totalHours += totalHours;
    acc[companyId].totalPayable += totalPayable;
    acc[companyId].shiftCount += 1;
    return acc;
  }, {} as Record<string, { company: string; shifts: CompletedShift[]; totalHours: number; totalPayable: number; shiftCount: number }>);

  const exportData = () => {
    const csv = [
      ["Shift", "Date", "Company", "Location", "Promoters", "Hours", "Payable"].join(","),
      ...filteredShifts.map(shift => {
        const { totalHours, totalPayable } = calculateShiftTotal(shift);
        return [
          shift.title,
          shift.date,
          shift.company_name || "",
          shift.location || "",
          (shift.assignments?.length || 0).toString(),
          totalHours.toFixed(2),
          totalPayable.toFixed(3)
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `completed-shifts-breakdown-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Completed Shifts Breakdown
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of all completed shifts with hours and payable amounts
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredShifts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredShifts.reduce((sum, shift) => {
                  const { totalHours } = calculateShiftTotal(shift);
                  return sum + totalHours;
                }, 0).toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {formatBHD(filteredShifts.reduce((sum, shift) => {
                  const { totalPayable } = calculateShiftTotal(shift);
                  return sum + totalPayable;
                }, 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Payable</p>
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
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as "date" | "company")}>
          <TabsList>
            <TabsTrigger value="date">By Date</TabsTrigger>
            <TabsTrigger value="company">By Company</TabsTrigger>
          </TabsList>

          <TabsContent value="date" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
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
                  ) : Object.values(groupedByDate).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No completed shifts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(groupedByDate)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((group) => (
                        <TableRow key={group.date}>
                          <TableCell className="font-medium">
                            {format(new Date(group.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">{group.shiftCount}</TableCell>
                          <TableCell className="text-right">{group.totalHours.toFixed(2)}h</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatBHD(group.totalPayable)}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
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
                  ) : Object.values(groupedByCompany).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No completed shifts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.values(groupedByCompany)
                      .sort((a, b) => b.totalPayable - a.totalPayable)
                      .map((group, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{group.company}</TableCell>
                          <TableCell className="text-right">{group.shiftCount}</TableCell>
                          <TableCell className="text-right">{group.totalHours.toFixed(2)}h</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatBHD(group.totalPayable)}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Detailed Shifts List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">All Shifts</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Promoters</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No shifts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShifts.map((shift) => {
                    const { totalHours, totalPayable } = calculateShiftTotal(shift);
                    return (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.title}</TableCell>
                        <TableCell>{format(new Date(shift.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{shift.company_name || "N/A"}</TableCell>
                        <TableCell>{shift.location || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          {shift.assignments?.length || 0}
                        </TableCell>
                        <TableCell className="text-right">{totalHours.toFixed(2)}h</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatBHD(totalPayable)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigate(`/shifts/${shift.id}`);
                              onOpenChange(false);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
