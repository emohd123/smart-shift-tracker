
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useShiftDetail } from "@/hooks/useShiftDetail";
import { ShiftDetailSkeleton } from "@/components/shifts/ShiftDetailSkeleton";
import { ShiftNotFound } from "@/components/shifts/ShiftNotFound";
import { ShiftDetailContent } from "@/components/shifts/ShiftDetailContent";

// Define the global interface for the window object
declare global {
  interface Window {
    deleteShift: (id: string) => void;
    startTimeTracking?: (shift: any) => void;
  }
}

const ShiftDetails = () => {
  const { id } = useParams<{ id: string }>();
  const {
    isAuthenticated,
    shift,
    loading,
    isCheckingOut,
    timeTrackerRef,
    handleCheckIn,
    handleCheckOut,
    handleDelete,
    navigate
  } = useShiftDetail(id);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <AppLayout title="Shift Details">
      {loading ? (
        <ShiftDetailSkeleton />
      ) : shift ? (
        <ShiftDetailContent
          shift={shift}
          timeTrackerRef={timeTrackerRef}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onDelete={handleDelete}
          isCheckingOut={isCheckingOut}
        />
      ) : (
        <ShiftNotFound />
      )}
    </AppLayout>
  );
};

export default ShiftDetails;
