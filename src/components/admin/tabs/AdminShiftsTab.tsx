import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import ShiftList from "@/components/shifts/ShiftList";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportButton } from "@/components/admin/shared/ExportButton";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { MetricCard } from "@/components/admin/shared/MetricCard";
import { getEffectiveStatus } from "@/components/shifts/utils/statusCalculations";

export default function AdminShiftsTab() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { shifts, loading } = useShiftsData({
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated,
  });

  const filteredShifts = shifts.filter((shift: any) => {
    const matchesSearch = shift.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shift.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const effectiveStatus = getEffectiveStatus(shift);
    const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: shifts.length,
    upcoming: shifts.filter((s: any) => getEffectiveStatus(s) === "upcoming").length,
    ongoing: shifts.filter((s: any) => getEffectiveStatus(s) === "ongoing").length,
    completed: shifts.filter((s: any) => getEffectiveStatus(s) === "completed").length,
  };

  // Prepare export data
  const exportData = filteredShifts.map((shift: any) => ({
    title: shift.title,
    date: shift.date,
    start_time: shift.startTime,
    end_time: shift.endTime,
    location: shift.location,
    pay_rate: shift.payRate,
    status: getEffectiveStatus(shift),
    company_id: shift.companyId,
  }));

  return (
    <div className="space-y-6">
      {/* Shift Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Shifts"
          value={stats.total}
          icon={Calendar}
          iconClassName="text-blue-600"
        />
        <MetricCard
          title="Upcoming"
          value={stats.upcoming}
          icon={Calendar}
          iconClassName="text-orange-600"
        />
        <MetricCard
          title="Ongoing"
          value={stats.ongoing}
          icon={Calendar}
          iconClassName="text-green-600"
        />
        <MetricCard
          title="Completed"
          value={stats.completed}
          icon={Calendar}
          iconClassName="text-gray-600"
        />
      </div>

      {/* Shift Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Shifts</CardTitle>
              <CardDescription>
                View, filter, and export all platform shifts
              </CardDescription>
            </div>
            <ExportButton
              data={exportData}
              filename={`shifts-${new Date().toISOString().split('T')[0]}`}
              disabled={filteredShifts.length === 0}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by title or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shifts List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading shifts...</div>
          ) : filteredShifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No shifts found</div>
          ) : (
            <ShiftList shifts={filteredShifts} title="" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
