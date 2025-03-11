
import { RefObject } from "react";
import { Shift } from "@/components/shifts/ShiftCard";
import ShiftDetail from "@/components/shifts/ShiftDetail";
import TimeTracker from "@/components/time/TimeTracker";

type ShiftDetailContentProps = {
  shift: Shift;
  timeTrackerRef: RefObject<{
    handleStartTracking: () => void;
    handleStopTracking: () => void;
  } | null>;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onDelete: (id: string) => void;
  isCheckingOut: boolean;
};

export function ShiftDetailContent({
  shift,
  timeTrackerRef,
  onCheckIn,
  onCheckOut,
  onDelete,
  isCheckingOut
}: ShiftDetailContentProps) {
  return (
    <div className="space-y-6">
      <ShiftDetail 
        shift={shift} 
        onCheckIn={onCheckIn} 
        onCheckOut={onCheckOut} 
        onDelete={onDelete}
      />
      
      {/* Always render TimeTracker but it will conditionally show based on its internal logic */}
      <TimeTracker 
        shift={shift}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
        ref={timeTrackerRef}
        autoStop={isCheckingOut}
      />
    </div>
  );
}
