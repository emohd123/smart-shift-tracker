
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { ShiftsContent } from "@/components/shifts/ShiftsContent";

// Define the global interface for the window object
declare global {
  interface Window {
    deleteShift: (id: string) => void;
  }
}

const Shifts = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
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
