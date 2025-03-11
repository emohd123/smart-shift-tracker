
import { useCallback } from "react";
import { Shift } from "../../shifts/ShiftCard";
import { useAuth } from "@/context/AuthContext";
import { useTimeTrackingState } from "./useTimeTrackingState";
import { useActiveTimeLogCheck } from "./useActiveTimeLogCheck";
import { useLocalStoragePersistence } from "./useLocalStoragePersistence";
import { useTimeTrackingActions } from "./useTimeTrackingActions";
import { useTimeCalculation } from "./useTimeCalculation";
import { useLocationVerification } from "./useLocationVerification";
import { useTimeLogs } from "./useTimeLogs";
import { toast } from "sonner";

export function useTimeTracking(shift?: Shift, onCheckIn?: () => void, onCheckOut?: () => void) {
  const { user } = useAuth();
  
  // State management
  const {
    isTracking,
    setIsTracking,
    startTime,
    setStartTime,
    loading,
    setLoading,
    locationVerified,
    setLocationVerified,
    showLocationError,
    setShowLocationError,
    timeLogId,
    setTimeLogId,
    permissionDenied,
    setPermissionDenied
  } = useTimeTrackingState();
  
  // Time and earnings calculations
  const { elapsedTime, setElapsedTime, earnings, resetTimeAndEarnings } = useTimeCalculation(isTracking, shift);
  
  // Location verification
  const { verifyLocation } = useLocationVerification();
  
  // Time logs operations
  const { checkExistingTimeLog, createTimeLog, logTimeEntry } = useTimeLogs(shift);
  
  // Check if shift is not active
  const isNotActiveShift = shift ? (shift.status === "completed" || shift.status === "cancelled") : false;
  
  // Check for active time logs when component mounts
  useActiveTimeLogCheck({
    shift,
    user,
    checkExistingTimeLog,
    setTimeLogId,
    setStartTime,
    setIsTracking,
    setLocationVerified,
    setElapsedTime
  });
  
  // Persist state to localStorage and handle page unload
  useLocalStoragePersistence({
    isTracking,
    startTime,
    timeLogId,
    shift,
    logTimeEntry,
    elapsedTime
  });
  
  // Time tracking actions (start/stop)
  const { handleStartTracking, handleStopTracking } = useTimeTrackingActions({
    shift,
    user,
    verifyLocation,
    createTimeLog,
    logTimeEntry,
    setIsTracking,
    setStartTime,
    setLocationVerified,
    setShowLocationError,
    setPermissionDenied,
    setLoading,
    setTimeLogId,
    setElapsedTime,
    resetTimeAndEarnings,
    elapsedTime,
    earnings,
    timeLogId,
    isTracking,
    startTime,
    onCheckIn,
    onCheckOut
  });

  // Error handling for location verification
  const handleLocationError = useCallback(() => {
    setShowLocationError(false);
    toast("Location verification will be attempted again on next check-in");
  }, [setShowLocationError]);

  return {
    isTracking,
    elapsedTime,
    earnings,
    startTime,
    loading,
    locationVerified,
    showLocationError,
    permissionDenied,
    isNotActiveShift,
    handleStartTracking,
    handleStopTracking,
    setShowLocationError,
    logTimeEntry,
    timeLogId,
    handleLocationError
  };
}
