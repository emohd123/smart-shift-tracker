import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PromoterDashboard from "@/components/dashboard/PromoterDashboard";
import { useAuth } from "@/context/AuthContext";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { UserRole } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard } from "lucide-react";

// Tab Components
import AdminOverviewTab from "@/components/admin/tabs/AdminOverviewTab";
import AdminUsersTab from "@/components/admin/tabs/AdminUsersTab";
import AdminShiftsTab from "@/components/admin/tabs/AdminShiftsTab";
import AdminRevenueTab from "@/components/admin/tabs/AdminRevenueTab";
import AdminReportsTab from "@/components/admin/tabs/AdminReportsTab";
import AdminSystemTab from "@/components/admin/tabs/AdminSystemTab";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { shifts, loading } = useShiftsData({
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  const isAdminLike = user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin;
  const isSuperAdmin = user?.role === UserRole.SuperAdmin;

  // Admin Dashboard
  if (isAdminLike) {
    return (
      <AppLayout title="Admin Dashboard">
        <div className="container mx-auto py-8 px-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Complete platform management and analytics
                {isSuperAdmin && " · Super Admin"}
              </p>
            </div>
          </div>

          {/* Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="shifts">Shifts</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <AdminOverviewTab />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <AdminUsersTab />
            </TabsContent>

            <TabsContent value="shifts" className="space-y-6">
              <AdminShiftsTab />
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <AdminRevenueTab />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <AdminReportsTab />
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <AdminSystemTab />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }

  if (user?.role === "company") {
    navigate("/company");
    return null;
  }

  // Promoter Dashboard
  return (
    <AppLayout title="Promoter Dashboard">
      <PromoterDashboard shifts={shifts} loading={loading} />
    </AppLayout>
  );
};

export default Dashboard;
