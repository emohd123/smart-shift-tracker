
import { useState, useEffect, useCallback } from "react";
import { Shift } from "../../shifts/ShiftCard";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "../components/TimeDisplay";
import { formatBHD } from "../../shifts/utils/currencyUtils";
import { useAuth } from "@/context/AuthContext";
import { useTimeLogs } from "./useTimeLogs";
import { useLocationVerification } from "./useLocationVerification";
import { useTimeCalculation } from "./useTimeCalculation";

export function useTimeTracking(shift?: Shift, onCheckIn?: () => void, onCheckOut?: () => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const [timeLogId, setTimeLogId] = useState<string | null>(null);
  
  const { elapsedTime, setElapsedTime, earnings, resetTimeAndEarnings } = useTimeCalculation(isTracking, shift);
  const { verifyLocation } = useLocationVerification();
  const { checkExistingTimeLog, createTimeLog, logTimeEntry } = useTimeLogs(shift);
  
  const isNotActiveShift = shift ? (shift.status === "completed" || shift.status === "cancelled") : false;
  
  // Check if there's an active time log for this shift when component mounts
  useEffect(() => {
    if (shift && user) {
      const fetchExistingTimeLog = async () => {
        const data = await checkExistingTimeLog(shift.id, user.id);
        
        if (data) {
          // We have an active time log, so let's resume tracking
          setTimeLogId(data.id);
          setStartTime(new Date(data.check_in_time));
          setIsTracking(true);
          setLocationVerified(true);
          
          // Calculate elapsed time since check-in
          const startTimeMs = new Date(data.check_in_time).getTime();
          const nowMs = new Date().getTime();
          const elapsedSeconds = Math.floor((nowMs - startTimeMs) / 1000);
          setElapsedTime(elapsedSeconds);
        }
      };
      
      fetchExistingTimeLog();
    }
  }, [shift, user, checkExistingTimeLog, setElapsedTime]);
  
  // Start time tracking
  const handleStartTracking = async () => {
    if (!user || !shift) return;
    
    setLoading(true);
    
    try {
      const locationValid = await verifyLocation(shift.id);
      if (!locationValid) {
        setShowLocationError(true);
        setLoading(false);
        return;
      }
      
      setLocationVerified(true);
      setShowLocationError(false);
      
      const now = new Date();
      setStartTime(now);
      setIsTracking(true);
      setElapsedTime(0);
      
      // Create time log entry when starting
      const data = await createTimeLog(now);
      if (data) {
        setTimeLogId(data.id);
      }
      
      toast({
        title: "Time Tracking Started",
        description: `Now tracking time for ${shift.title}`,
      });
      
      if (onCheckIn) onCheckIn();
    } catch (error) {
      console.error("Error starting time tracking:", error);
      toast({
        title: "Error",
        description: "Could not start time tracking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Stop time tracking
  const handleStopTracking = () => {
    if (shift && (timeLogId || isTracking)) {
      logTimeEntry(shift.id, timeLogId, isTracking, startTime, elapsedTime);
    }
    
    setIsTracking(false);
    setLocationVerified(false);
    setTimeLogId(null);
    
    const duration = formatTime(elapsedTime);
    toast({
      title: "Time Tracking Stopped",
      description: `You worked for ${duration} and earned ${formatBHD(earnings)}`,
    });
    
    if (onCheckOut) onCheckOut();
    
    resetTimeAndEarnings();
    setStartTime(null);
  };

  return {
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
    logTimeEntry
  };
}
