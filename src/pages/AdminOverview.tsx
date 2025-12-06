import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import UserStatistics from "@/components/admin/UserStatistics";
import CertificateRevenue from "@/components/admin/CertificateRevenue";
import PlatformActivity from "@/components/admin/PlatformActivity";
import { Users, Calendar, DollarSign, FileDown, LayoutDashboard } from "lucide-react";

export default function AdminOverview() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <AppLayout title="Admin Overview">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </AppLayout>
    );
  }

  const quickActions = [
    { label: "View Users", icon: Users, path: "/promoters" },
    { label: "View Shifts", icon: Calendar, path: "/shifts" },
    { label: "Revenue Details", icon: DollarSign, path: "/revenue" },
    { label: "Reports", icon: FileDown, path: "/reports" }
  ];

  return (
    <AppLayout title="Admin Overview">
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Complete platform oversight and management
            </p>
          </div>
        </div>

        {/* User Statistics */}
        <UserStatistics />

        {/* Certificate Revenue */}
        <CertificateRevenue />

        {/* Platform Activity */}
        <PlatformActivity />

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
