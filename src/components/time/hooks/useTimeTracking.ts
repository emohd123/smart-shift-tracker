
import { useState, useEffect } from "react";
import { Shift } from "../../shifts/ShiftCard";
import { useToast } from "@/hooks/use-toast";
import { formatTime, formatBHD } from "../components/TimeDisplay";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation, isWithinRadius } from "../../shifts/utils/locationUtils";

export function useTimeTracking(shift?: Shift, onCheckIn?: () => void, onCheckOut?: () => void) {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  
  const isNotActiveShift = shift ? (shift.status === "completed" || shift.status === "cancelled") : false;
  
  useEffect(() => {
    if (shift && isTracking) {
      const hourlyRate = shift.payRate;
      const hours = elapsedTime / 3600;
      setEarnings(hours * hourlyRate);
    }
  }, [elapsedTime, shift, isTracking]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTracking]);
  
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
  
  const handleStartTracking = async () => {
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
      setIsTracking(true);
      setStartTime(new Date());
      
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
  
  const handleStopTracking = () => {
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
    setShowLocationError
  };
}
