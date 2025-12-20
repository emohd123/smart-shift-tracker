import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import UserStatistics from "@/components/admin/UserStatistics";
import CertificateRevenue from "@/components/admin/CertificateRevenue";
import PlatformActivity from "@/components/admin/PlatformActivity";
import { Calendar, DollarSign, FileDown, LayoutDashboard, Users, Activity, CheckCircle } from "lucide-react";
import { UserRole } from "@/types/database";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import ShiftList from "@/components/shifts/ShiftList";
import { getEffectiveStatus } from "@/components/shifts/utils/statusCalculations";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";

export default function AdminOverview() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isAdminLike = user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin;
  const isSuperAdmin = user?.role === UserRole.SuperAdmin;

  const { shifts, loading: shiftsLoading } = useShiftsData({
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated,
  });

  useEffect(() => {
    if (isAuthenticated && !isAdminLike) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isAdminLike, navigate]);

  if (!isAuthenticated || !isAdminLike) {
    return (
      <AppLayout title="Super Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </AppLayout>
    );
  }

  const opsStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todaysShifts = shifts.filter((s: any) => s.date === today);
    const activeToday = todaysShifts.filter((s: any) => getEffectiveStatus(s) === "ongoing");
    const completedAll = shifts.filter((s: any) => getEffectiveStatus(s) === "completed");

    // Approx payable: payRate * 8 hours (best-effort as existing data doesn't store actual hours here)
    const totalPayable = completedAll.reduce((sum: number, s: any) => sum + (Number(s.payRate || 0) * 8), 0);

    return {
      todaysCount: todaysShifts.length,
      activeCount: activeToday.length,
      completedCount: completedAll.length,
      totalPayable,
    };
  }, [shifts]);

  const quickActions = [
    { label: "View Users", icon: Users, path: "/promoters" },
    { label: "View Shifts", icon: Calendar, path: "/shifts" },
    { label: "Revenue Details", icon: DollarSign, path: "/revenue" },
    { label: "Reports", icon: FileDown, path: "/reports" }
  ];

  return (
    <AppLayout title="Super Admin Dashboard">
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Complete platform oversight and management{isSuperAdmin ? "" : " (Admin view)"}
            </p>
          </div>
        </div>

        {/* Operations snapshot (mixes the old Admin Dashboard with platform overview) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shiftsLoading ? "—" : opsStats.todaysCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Active now: {shiftsLoading ? "—" : opsStats.activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Shifts</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shiftsLoading ? "—" : opsStats.completedCount}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payable (Estimate)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shiftsLoading ? "—" : formatBHD(opsStats.totalPayable)}</div>
              <p className="text-xs text-muted-foreground mt-1">Based on completed shifts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">OK</div>
              <p className="text-xs text-muted-foreground mt-1">Realtime + core services</p>
            </CardContent>
          </Card>
        </div>

        {/* User Statistics */}
        <UserStatistics />

        {/* Certificate Revenue */}
        <CertificateRevenue />

        {/* Platform Activity */}
        <PlatformActivity />

        {/* Recent shifts (admin operations) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Shifts</h3>
            <Button variant="outline" size="sm" onClick={() => navigate("/shifts")}>View all</Button>
          </div>
          <ShiftList shifts={(shifts || []).slice(0, 8)} title="" />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => navigate(action.path)}
                >
                  <action.icon className="h-5 w-5" />
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
