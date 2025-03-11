
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
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const { elapsedTime, setElapsedTime, earnings, resetTimeAndEarnings } = useTimeCalculation(isTracking, shift);
  const { verifyLocation } = useLocationVerification();
  const { checkExistingTimeLog, createTimeLog, logTimeEntry } = useTimeLogs(shift);
  
  const isNotActiveShift = shift ? (shift.status === "completed" || shift.status === "cancelled") : false;
  
  // Check if there's an active time log for this shift when component mounts
  useEffect(() => {
    if (shift && user) {
      const fetchExistingTimeLog = async () => {
        try {
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
            
            // Notify if returning to an active session
            if (startTimeMs < (nowMs - 60000)) { // Only notify if more than a minute has passed
              toast({
                title: "Session Resumed",
                description: `Continuing time tracking for ${shift.title}`,
              });
            }
          }
        } catch (error) {
          console.error("Error checking existing time logs:", error);
          toast({
            title: "Error",
            description: "Could not check for existing time logs. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      fetchExistingTimeLog();
    }
  }, [shift, user, checkExistingTimeLog, setElapsedTime, toast]);
  
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
  
  // Start time tracking
  const handleStartTracking = async () => {
    if (!user || !shift) return;
    
    setLoading(true);
    setPermissionDenied(false);
    
    try {
      // Request permission for notifications if not already granted
      if (Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
        await Notification.requestPermission();
      }
      
      const locationValid = await verifyLocation(shift.id);
      if (!locationValid) {
        if (locationValid === null) {
          setPermissionDenied(true);
          toast({
            title: "Location Permission Denied",
            description: "Please enable location access in your browser settings to track time.",
            variant: "destructive"
          });
        } else {
          setShowLocationError(true);
        }
        setLoading(false);
        return;
      }
      
      setLocationVerified(true);
      setShowLocationError(false);
      setPermissionDenied(false);
      
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
      
      // Send a notification if permission was granted
      if (Notification && Notification.permission === "granted") {
        new Notification("Time Tracking Started", {
          body: `Now tracking time for ${shift.title}`,
          icon: "/favicon.ico"
        });
      }
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
    if (!shift) return;
    
    if (timeLogId || isTracking) {
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
    
    // Send a notification if permission was granted
    if (Notification && Notification.permission === "granted") {
      new Notification("Time Tracking Completed", {
        body: `You worked for ${duration} and earned ${formatBHD(earnings)}`,
        icon: "/favicon.ico"
      });
    }
    
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
    permissionDenied,
    isNotActiveShift,
    handleStartTracking,
    handleStopTracking,
    setShowLocationError,
    logTimeEntry,
    timeLogId
  };
}
