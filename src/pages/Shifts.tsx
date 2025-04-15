
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useShiftsData } from "@/hooks/shifts/useShiftsData";
import { ShiftsContent } from "@/components/shifts/ShiftsContent";
import { toast } from "sonner";

const Shifts = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Fetch shifts data based on user role and authentication status
  const { shifts, loading, error, deleteShift, deleteAllShifts, addShift, refreshShifts } = useShiftsData({
    userId: user?.id,
    userRole: user?.role,
    isAuthenticated
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Failed to load shifts data", {
        description: error.message || "Please try again later or contact support if the problem persists."
      });
    }
  }, [error]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Make global functions available
  useEffect(() => {
    window.addShift = (shift) => {
      addShift(shift);
      // After adding a shift, refresh the data to ensure it's up to date
      refreshShifts();
    };
    
    // Make deleteShift, deleteAllShifts and refreshShifts available globally
    window.deleteShift = (id) => {
      deleteShift(id);
      // After deleting a shift, refresh the data to ensure it's up to date
      refreshShifts();
    };
    
    window.deleteAllShifts = () => {
      deleteAllShifts();
      // After deleting all shifts, refresh the data
      refreshShifts();
    };
    
    window.refreshShifts = refreshShifts;
    
    return () => {
      window.addShift = undefined;
      window.deleteShift = undefined;
      window.deleteAllShifts = undefined;
      window.refreshShifts = undefined;
    };
  }, [addShift, deleteShift, deleteAllShifts, refreshShifts]);

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
        deleteAllShifts={deleteAllShifts}
        refreshShifts={refreshShifts}
      />
    </AppLayout>
  );
};

export default Shifts;
