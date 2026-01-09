import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Users, Building2, Search } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getEffectiveStatus } from "@/components/shifts/utils/statusCalculations";

interface ShiftWithDetails {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  status: string | null;
  manual_status_override: boolean | null;
  override_status: string | null;
  company_name?: string | null;
  assignments?: Array<{
    promoter_id: string;
    promoter_name?: string | null;
  }>;
}

export default function TodaysShiftsBreakdown({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [shifts, setShifts] = useState<ShiftWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchTodaysShifts();
    }
  }, [open]);

  const fetchTodaysShifts = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      // Fetch shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from("shifts")
        .select("id, title, date, start_time, end_time, location, status, manual_status_override, override_status, company_id")
        .eq("date", today)
        .order("start_time", { ascending: true });

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

      // Fetch promoter names
      const promoterIds = [...new Set((assignments || []).map(a => a.promoter_id).filter(Boolean))];
      let promoterMap = new Map<string, string>();
      if (promoterIds.length > 0) {
        const { data: promoters } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", promoterIds);
        
        promoters?.forEach(p => {
          promoterMap.set(p.id, p.full_name || "Unknown");
        });
      }

      // Group assignments by shift
      const assignmentsByShift = new Map<string, any[]>();
      assignments?.forEach(a => {
        if (!assignmentsByShift.has(a.shift_id)) {
          assignmentsByShift.set(a.shift_id, []);
        }
        assignmentsByShift.get(a.shift_id)?.push({
          promoter_id: a.promoter_id,
          promoter_name: promoterMap.get(a.promoter_id) || null,
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
        status: shift.status,
        manual_status_override: shift.manual_status_override,
        override_status: shift.override_status,
        company_name: shift.company_id ? companyMap.get(shift.company_id) : null,
        assignments: assignmentsByShift.get(shift.id) || [],
      }));

      setShifts(transformedData);
    } catch (error) {
      console.error("Error fetching today's shifts:", error);
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

  const activeShifts = filteredShifts.filter((shift) => 
    getEffectiveStatus(shift) === "ongoing"
  );
  const upcomingShifts = filteredShifts.filter((shift) => 
    getEffectiveStatus(shift) === "upcoming"
  );

  const getStatusBadge = (shift: ShiftWithDetails) => {
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Shifts Breakdown
          </DialogTitle>
          <DialogDescription>
            All shifts scheduled for today with detailed information
          </DialogDescription>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredShifts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Shifts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{activeShifts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active Now</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{upcomingShifts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Upcoming</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search shifts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border rounded-md"
          />
        </div>

        {/* Shifts Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Promoters</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No shifts scheduled for today
                  </TableCell>
                </TableRow>
              ) : (
                filteredShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.title}</TableCell>
                    <TableCell>{shift.company_name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {shift.start_time} - {shift.end_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {shift.location || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {shift.assignments?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(shift)}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
