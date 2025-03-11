
import { useEffect } from "react";
import { Shift } from "../../shifts/ShiftCard";

type UseLocalStoragePersistenceProps = {
  isTracking: boolean;
  startTime: Date | null;
  timeLogId: string | null;
  shift?: Shift;
  logTimeEntry: (shiftId: string, timeLogId: string | null, isTracking: boolean, startTime: Date | null, elapsedTime: number) => void;
  elapsedTime: number;
};

export function useLocalStoragePersistence({
  isTracking,
  startTime,
  timeLogId,
  shift,
  logTimeEntry,
  elapsedTime
}: UseLocalStoragePersistenceProps) {
  // Save time tracking state to localStorage to persist between page reloads
  useEffect(() => {
    if (isTracking && startTime && shift) {
      // Store minimum info needed to restore tracking state
      localStorage.setItem('activeTracking', JSON.stringify({
        shiftId: shift.id,
        startTime: startTime.toISOString(),
        timeLogId
      }));
    } else {
      localStorage.removeItem('activeTracking');
    }
  }, [isTracking, startTime, timeLogId, shift]);
  
  // Handle beforeunload event to ensure data is saved when user leaves the site
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTracking && shift && startTime) {
        // If user is leaving while tracking, make sure we save the current time log
        logTimeEntry(shift.id, timeLogId, isTracking, startTime, elapsedTime);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTracking, shift, timeLogId, startTime, elapsedTime, logTimeEntry]);
}
