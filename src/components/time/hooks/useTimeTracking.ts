
import { useState, useEffect, useCallback } from "react";
import { Shift } from "../../shifts/ShiftCard";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "../components/TimeDisplay";
import { formatBHD } from "../../shifts/utils/currencyUtils";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation, isWithinRadius } from "../../shifts/utils/locationUtils";
import { useAuth } from "@/context/AuthContext";

export function useTimeTracking(shift?: Shift, onCheckIn?: () => void, onCheckOut?: () => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const [timeLogId, setTimeLogId] = useState<string | null>(null);
  
  const isNotActiveShift = shift ? (shift.status === "completed" || shift.status === "cancelled") : false;
  
  // Check if there's an active time log for this shift when component mounts
  useEffect(() => {
    if (shift && user) {
      const checkExistingTimeLog = async () => {
        try {
          const { data, error } = await supabase
            .from('time_logs')
            .select('*')
            .eq('shift_id', shift.id)
            .eq('user_id', user.id)
            .is('check_out_time', null)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            console.error("Error checking time logs:", error);
            return;
          }
          
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
        } catch (error) {
          console.error("Error checking existing time logs:", error);
        }
      };
      
      checkExistingTimeLog();
    }
  }, [shift, user]);
  
  // Update earnings based on elapsed time
  useEffect(() => {
    if (shift && isTracking) {
      const hourlyRate = shift.payRate;
      const hours = elapsedTime / 3600;
      setEarnings(hours * hourlyRate);
    }
  }, [elapsedTime, shift, isTracking]);
  
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
  
  // Function to log time entry to database
  const logTimeEntry = useCallback(async (shiftId: string) => {
    if (!user) return;
    
    try {
      if (timeLogId) {
        // Update existing time log with check-out time
        const checkOutTime = new Date();
        const hours = elapsedTime / 3600;
        
        await supabase
          .from('time_logs')
          .update({
            check_out_time: checkOutTime.toISOString(),
            total_hours: hours,
            earnings: shift ? hours * shift.payRate : 0
          })
          .eq('id', timeLogId);
        
        setTimeLogId(null);
      } else if (isTracking) {
        // Create new time log entry
        const checkInTime = startTime || new Date();
        const checkOutTime = new Date();
        const hours = elapsedTime / 3600;
        
        await supabase
          .from('time_logs')
          .insert({
            user_id: user.id,
            shift_id: shiftId,
            check_in_time: checkInTime.toISOString(),
            check_out_time: checkOutTime.toISOString(),
            total_hours: hours,
            earnings: shift ? hours * shift.payRate : 0
          });
      }
    } catch (error) {
      console.error("Error logging time entry:", error);
      toast({
        title: "Error",
        description: "Could not save your time entry.",
        variant: "destructive"
      });
    }
  }, [timeLogId, user, isTracking, startTime, elapsedTime, shift, toast]);
  
  // Verify location for check-in
  const verifyLocation = async (): Promise<boolean> => {
    if (!shift) return true;
    
    try {
      const { data: shiftLocation, error } = await supabase
        .from('shift_locations')
        .select('*')
        .eq('shift_id', shift.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking location:", error);
        return false;
      }
      
      if (!shiftLocation) {
        return true;
      }
      
      const coords = await getCurrentLocation();
      
      const within = isWithinRadius(
        coords.latitude,
        coords.longitude,
        Number(shiftLocation.latitude),
        Number(shiftLocation.longitude),
        shiftLocation.radius
      );
      
      if (!within) {
        toast({
          title: "Wrong Location",
          description: "You must be at the shift location to start tracking time.",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Location verification error:", error);
      toast({
        title: "Location Error",
        description: "Could not verify your location. Please check your location permissions.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Start time tracking
  const handleStartTracking = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const locationValid = await verifyLocation();
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
      if (shift) {
        const { data, error } = await supabase
          .from('time_logs')
          .insert({
            user_id: user.id,
            shift_id: shift.id,
            check_in_time: now.toISOString()
          })
          .select()
          .single();
          
        if (error) {
          console.error("Error creating time log:", error);
          toast({
            title: "Error",
            description: "Could not create time log entry.",
            variant: "destructive"
          });
        } else if (data) {
          setTimeLogId(data.id);
        }
      }
      
      toast({
        title: "Time Tracking Started",
        description: shift 
          ? `Now tracking time for ${shift.title}` 
          : "Your time is now being tracked",
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
    if (shift && timeLogId) {
      logTimeEntry(shift.id);
    }
    
    setIsTracking(false);
    setLocationVerified(false);
    
    const duration = formatTime(elapsedTime);
    toast({
      title: "Time Tracking Stopped",
      description: `You worked for ${duration} and earned ${formatBHD(earnings)}`,
    });
    
    if (onCheckOut) onCheckOut();
    
    setTimeout(() => {
      setElapsedTime(0);
      setEarnings(0);
      setStartTime(null);
    }, 5000);
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
