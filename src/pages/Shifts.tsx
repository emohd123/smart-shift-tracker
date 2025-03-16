
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { ShiftsContent } from "@/components/shifts/ShiftsContent";

const Shifts = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Fetch shifts data based on user role and authentication status
  const { shifts, loading, deleteShift } = useShiftsData({
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  const pageTitle = user?.role === "promoter" ? "My Shifts" : "All Shifts";

  return (
    <AppLayout title={pageTitle}>
      <ShiftsContent 
        shifts={shifts} 
        loading={loading} 
        title={pageTitle}
        deleteShift={deleteShift}
      />
    </AppLayout>
  );
};

export default Shifts;
