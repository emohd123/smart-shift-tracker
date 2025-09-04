
import { forwardRef } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import TimeTrackerWrapper from "./TimeTrackerWrapper";

type TimeTrackerProps = {
  shift?: Shift;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  autoStart?: boolean;
  autoStop?: boolean;
};

// This component is a simple wrapper around TimeTrackerWrapper
// It maintains the same API for backward compatibility
const TimeTracker = forwardRef(({ 
  shift, 
  onCheckIn, 
  onCheckOut,
  autoStart,
  autoStop
}: TimeTrackerProps, ref) => {
  return (
    <TimeTrackerWrapper
      shift={shift}
      onCheckIn={onCheckIn}
      onCheckOut={onCheckOut}
      autoStart={autoStart}
      autoStop={autoStop}
      ref={ref}
    />
  );
});

TimeTracker.displayName = "TimeTracker";

export default TimeTracker;
