import { useCallback } from "react";
import { Shift } from "../../shifts/ShiftCard";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/context/AuthContext";
import { formatTime } from "../components/TimeDisplay";
import { formatBHD } from "../../shifts/utils/currencyUtils";

type UseTimeTrackingActionsProps = {
  shift?: Shift;
  user: User | null;
  verifyLocation: (shiftId: string) => Promise<boolean | null>;
  createTimeLog: (checkInTime: Date) => Promise<any>;
  logTimeEntry: (shiftId: string, timeLogId: string | null, isTracking: boolean, startTime: Date | null, elapsedTime: number) => void;
  setIsTracking: (tracking: boolean) => void;
  setStartTime: (time: Date | null) => void;
  setLocationVerified: (verified: boolean) => void;
  setShowLocationError: (show: boolean) => void;
  setPermissionDenied: (denied: boolean) => void;
  setLoading: (loading: boolean) => void;
  setTimeLogId: (id: string | null) => void;
  setElapsedTime: (time: number) => void;
  resetTimeAndEarnings: () => void;
  elapsedTime: number;
  earnings: number;
  timeLogId: string | null;
  isTracking: boolean;
  startTime: Date | null;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
};

export function useTimeTrackingActions({
  shift,
  user,
  verifyLocation,
  createTimeLog,
  logTimeEntry,
  setIsTracking,
  setStartTime,
  setLocationVerified,
  setShowLocationError,
  setPermissionDenied,
  setLoading,
  setTimeLogId,
  setElapsedTime,
  resetTimeAndEarnings,
  elapsedTime,
  earnings,
  timeLogId,
  isTracking,
  startTime,
  onCheckIn,
  onCheckOut
}: UseTimeTrackingActionsProps) {
  const { toast } = useToast();
  
  const handleStartTracking = useCallback(async () => {
    if (!user || !shift) return;
    
    setLoading(true);
    setPermissionDenied(false);
    
    try {
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
      
      const data = await createTimeLog(now);
      if (data) {
        setTimeLogId(data.id);
      }
      
      toast({
        title: "Time Tracking Started",
        description: `Now tracking time for ${shift.title}`,
      });
      
      if (onCheckIn) onCheckIn();
      
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
  }, [
    user, shift, verifyLocation, setLoading, setPermissionDenied, toast,
    setLocationVerified, setShowLocationError, setStartTime, setIsTracking,
    setElapsedTime, createTimeLog, setTimeLogId, onCheckIn
  ]);
  
  const handleStopTracking = useCallback(() => {
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
    
    if (Notification && Notification.permission === "granted") {
      new Notification("Time Tracking Completed", {
        body: `You worked for ${duration} and earned ${formatBHD(earnings)}`,
        icon: "/favicon.ico"
      });
    }
    
    resetTimeAndEarnings();
    setStartTime(null);
  }, [
    shift, timeLogId, isTracking, logTimeEntry, startTime, elapsedTime,
    setIsTracking, setLocationVerified, setTimeLogId, toast, earnings,
    onCheckOut, resetTimeAndEarnings, setStartTime
  ]);
  
  return {
    handleStartTracking,
    handleStopTracking
  };
}
