import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import PromoterDashboard from "@/components/dashboard/PromoterDashboard";
import { useAuth } from "@/context/AuthContext";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";

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

  if (user?.role === "admin") {
    return (
      <AppLayout title="Admin Dashboard">
        <AdminDashboard shifts={shifts} loading={loading} />
      </AppLayout>
    );
  }

  if (user?.role === "company_admin" || user?.role === "company_manager") {
    navigate("/company");
    return null;
  }

  return (
    <AppLayout title="Part-timer Dashboard">
      <PromoterDashboard shifts={shifts} />
    </AppLayout>
  );
};

export default Dashboard;
