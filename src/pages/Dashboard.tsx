import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PromoterDashboard from "@/components/dashboard/PromoterDashboard";
import { useAuth } from "@/context/AuthContext";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { UserRole } from "@/types/database";
import AdminOverview from "./AdminOverview";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  if (user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin) {
    return (
      <AdminOverview />
    );
  }

  if (user?.role === "company") {
    navigate("/company");
    return null;
  }

  return (
    <AppLayout title="Promoter Dashboard">
      <PromoterDashboard shifts={shifts} loading={loading} />
    </AppLayout>
  );
};

export default Dashboard;
