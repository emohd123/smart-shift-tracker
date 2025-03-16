
import { useRef } from "react";
import { Shift } from "./ShiftCard";
import ShiftDetail from "./ShiftDetail";
import TimeTracker from "../time/TimeTracker";

type ShiftDetailContentProps = {
  shift: Shift;
  timeTrackerRef: React.MutableRefObject<{
    handleStartTracking: () => void;
    handleStopTracking: () => void;
  } | null>;
  isCheckedIn?: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onDelete: (id: string) => void;
  isCheckingOut: boolean;
};

export const ShiftDetailContent = ({
  shift,
  timeTrackerRef,
  isCheckedIn,
  onCheckIn,
  onCheckOut,
  onDelete,
  isCheckingOut
}: ShiftDetailContentProps) => {
  return (
    <div className="space-y-8">
      <ShiftDetail 
        shift={shift}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
        onDelete={onDelete}
      />
      
      <TimeTracker 
        shift={shift}
        ref={timeTrackerRef}
        autoStart={false}
        autoStop={isCheckingOut}
      />
    </div>
  );
};
