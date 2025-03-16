
import { useRef } from "react";
import { Shift } from "./ShiftCard";
import ShiftDetail from "./ShiftDetail";
import TimeTracker from "../time/TimeTracker";
import { cn } from "@/lib/utils";

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
    <div className={cn(
      "space-y-8 transition-all duration-300",
      "animate-fade-in"
    )}>
      <ShiftDetail 
        shift={shift}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
        onDelete={onDelete}
      />
      
      <div className="bg-card/50 rounded-lg p-6 border border-border/40 shadow-sm">
        <TimeTracker 
          shift={shift}
          ref={timeTrackerRef}
          autoStart={false}
          autoStop={isCheckingOut}
        />
      </div>
    </div>
  );
};
