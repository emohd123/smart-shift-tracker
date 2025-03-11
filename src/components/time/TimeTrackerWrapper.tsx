
import { forwardRef, useImperativeHandle, useEffect } from "react";
import { Shift } from "../shifts/ShiftCard";
import { useTimeTracking } from "./hooks/useTimeTracking";
import TimeTrackerCard from "./components/TimeTrackerCard";

type TimeTrackerProps = {
  shift?: Shift;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  autoStart?: boolean;
  autoStop?: boolean;
};

const TimeTrackerWrapper = forwardRef(({ 
  shift, 
  onCheckIn, 
  onCheckOut,
  autoStart,
  autoStop
}: TimeTrackerProps, ref) => {
  const {
    isTracking,
    elapsedTime,
    earnings,
    startTime,
    loading,
    locationVerified,
    showLocationError,
    isNotActiveShift,
    handleStartTracking,
    handleStopTracking,
    setShowLocationError,
    logTimeEntry,
    timeLogId,
    handleLocationError
  } = useTimeTracking(shift, onCheckIn, onCheckOut);
  
  // Expose the handleStartTracking method to parent components
  useImperativeHandle(ref, () => ({
    handleStartTracking,
    handleStopTracking
  }));
  
  // Auto-start tracking when the autoStart prop is true
  useEffect(() => {
    if (autoStart && shift && !isTracking && !isNotActiveShift) {
      handleStartTracking();
    }
  }, [autoStart, shift, isTracking, isNotActiveShift, handleStartTracking]);
  
  // Auto-stop tracking when the autoStop prop is true
  useEffect(() => {
    if (autoStop && isTracking && shift) {
      handleStopTracking();
      
      // Log the time entry when stopping automatically
      if (shift && timeLogId) {
        logTimeEntry(shift.id, timeLogId, isTracking, startTime, elapsedTime);
      }
    }
  }, [autoStop, isTracking, handleStopTracking, logTimeEntry, shift, timeLogId, startTime, elapsedTime]);
  
  // Don't render the component if there's nothing to show and it's not supposed to autoStart
  if (!isTracking && !shift) {
    return null;
  }
  
  return (
    <TimeTrackerCard
      isTracking={isTracking}
      startTime={startTime}
      elapsedTime={elapsedTime}
      earnings={earnings}
      locationVerified={locationVerified}
      showLocationError={showLocationError}
      loading={loading}
      isNotActiveShift={isNotActiveShift}
      handleStartTracking={handleStartTracking}
      handleStopTracking={handleStopTracking}
      handleDismissError={handleLocationError}
      autoStart={autoStart}
      autoStop={autoStop}
    />
  );
});

TimeTrackerWrapper.displayName = "TimeTrackerWrapper";

export default TimeTrackerWrapper;
