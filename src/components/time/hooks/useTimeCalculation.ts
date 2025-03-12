
import { useState, useEffect } from "react";
import { Shift } from "../../shifts/ShiftCard";

export function useTimeCalculation(isTracking: boolean, shift?: Shift, onCheckOutTime?: () => void) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [earnings, setEarnings] = useState(0);

  // Timer effect to update elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          // Check if it's time to check out based on shift end time
          if (shift && shouldCheckOut(shift)) {
            if (onCheckOutTime) {
              onCheckOutTime();
            }
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTracking, shift, onCheckOutTime]);

  // Update earnings based on elapsed time
  useEffect(() => {
    if (shift && isTracking) {
      // Calculate earnings based on pay rate type
      let calculatedEarnings = 0;
      const hourlyRate = shift.payRate;
      
      if (shift.payRateType === 'day') {
        // For day rate, calculate the proportion of the day worked
        const workHours = elapsedTime / 3600;
        const workDay = 8; // Assuming 8-hour work day
        calculatedEarnings = (workHours / workDay) * hourlyRate;
      } else if (shift.payRateType === 'month') {
        // For month rate, calculate the proportion of the month worked
        const workHours = elapsedTime / 3600;
        const workMonth = 160; // Assuming 160-hour work month
        calculatedEarnings = (workHours / workMonth) * hourlyRate;
      } else {
        // Default hourly rate
        const hours = elapsedTime / 3600;
        calculatedEarnings = hours * hourlyRate;
      }
      
      setEarnings(calculatedEarnings);
    }
  }, [elapsedTime, shift, isTracking]);

  // Function to check if current time is past the shift end time
  const shouldCheckOut = (shift: Shift) => {
    const now = new Date();
    const currentTimeString = now.toTimeString().substring(0, 5); // Get HH:MM format
    
    // Check if current time is past the end time
    return currentTimeString >= shift.endTime;
  };

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
