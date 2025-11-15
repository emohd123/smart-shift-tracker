
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useShiftDetail } from "@/hooks/useShiftDetail";
import { ShiftDetailSkeleton } from "@/components/shifts/ShiftDetailSkeleton";
import { ShiftNotFound } from "@/components/shifts/ShiftNotFound";
import { ShiftDetailContent } from "@/components/shifts/ShiftDetailContent";

const ShiftDetails = () => {
  const { id } = useParams<{ id: string }>();
  const {
    isAuthenticated,
    shift,
    loading,
    handleDelete,
    navigate,
    userRole,
    refreshShift,
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
          onDelete={handleDelete}
          onUpdate={refreshShift}
          userRole={userRole}
        />
      ) : (
        <ShiftNotFound />
      )}
    </AppLayout>
  );
};

export default ShiftDetails;
