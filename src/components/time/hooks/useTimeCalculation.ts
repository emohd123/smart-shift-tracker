
import { useState, useEffect } from "react";
import { Shift } from "../../shifts/ShiftCard";

export function useTimeCalculation(isTracking: boolean, shift?: Shift) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [earnings, setEarnings] = useState(0);

  // Timer effect to update elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTracking]);

  // Update earnings based on elapsed time
  useEffect(() => {
    if (shift && isTracking) {
      const hourlyRate = shift.payRate;
      const hours = elapsedTime / 3600;
      setEarnings(hours * hourlyRate);
    }
  }, [elapsedTime, shift, isTracking]);

  const resetTimeAndEarnings = () => {
    setTimeout(() => {
      setElapsedTime(0);
      setEarnings(0);
    }, 5000);
  };

  return {
    elapsedTime,
    setElapsedTime,
    earnings,
    resetTimeAndEarnings
  };
}
