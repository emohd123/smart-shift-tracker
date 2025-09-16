import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { ROUTES, isAdminRole, isCompanyRole, isPartTimerRole } from "@/utils/routes";
import { TenantContext } from "@/hooks/useCurrentTenant";

// Dashboard Components
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PromoterDashboard from "@/components/dashboard/PromoterDashboard";
import CompanyDashboard from "./CompanyDashboard";

const UnifiedDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const tenantCtx = useContext(TenantContext);
  const fallbackRole = tenantCtx?.userRole || user?.role;

  const { shifts, loading } = useShiftsData({
    userId: user?.id,
    userRole: fallbackRole,
    isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
  }, [isAuthenticated, navigate]);

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // If user exists but role is not determined yet, render a lightweight placeholder
  if (user && !user.role) {
    return (
      <AppLayout title="Loading Dashboard">
        <div className="p-6 text-muted-foreground">Preparing your dashboard...</div>
      </AppLayout>
    );
  }

  // Company Dashboard - dedicated route
  if (isCompanyRole(fallbackRole)) {
    return (
      <AppLayout title="Company Dashboard">
        <CompanyDashboard />
      </AppLayout>
    );
  }

  // Admin Dashboard
  if (isAdminRole(fallbackRole)) {
    return (
      <AppLayout title="Admin Dashboard">
        <AdminDashboard shifts={shifts} loading={loading} />
      </AppLayout>
    );
  }

  // Part-timer Dashboard (default)
  return (
    <AppLayout title="My Dashboard">
      <PromoterDashboard shifts={shifts} />
    </AppLayout>
  );
};

export default UnifiedDashboard;
