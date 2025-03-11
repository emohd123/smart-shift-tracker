import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Calendar, DollarSign, PlayCircle, StopCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Shift } from "../shifts/ShiftCard";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation, isWithinRadius } from "../shifts/utils/locationUtils";

type TimeTrackerProps = {
  shift?: Shift;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
};

export default function TimeTracker({ shift, onCheckIn, onCheckOut }: TimeTrackerProps) {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
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
        setLoading(false);
        return;
      }
      
      setLocationVerified(true);
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
    
    toast({
      title: "Time Tracking Stopped",
      description: `You worked for ${formatTime(elapsedTime)} and earned $${earnings.toFixed(2)}`,
    });
    
    if (onCheckOut) onCheckOut();
    
    setTimeout(() => {
      setElapsedTime(0);
      setEarnings(0);
      setStartTime(null);
    }, 5000);
  };
  
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className={cn(
      "border border-border/50 transition-all duration-300",
      isTracking && "border-primary/20 shadow-md"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Time Tracker</span>
          {isTracking && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isTracking 
            ? `Started at ${startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : "Track your work hours and earnings"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-6 flex flex-col items-center justify-center">
          <div className="text-4xl font-mono font-semibold mb-2">
            {formatTime(elapsedTime)}
          </div>
          {isTracking && shift && (
            <div className="text-muted-foreground text-sm mt-1">
              Current earnings: ${earnings.toFixed(2)}
            </div>
          )}
        </div>
        
        {locationVerified && (
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
              <MapPin size={12} />
              Location Verified
            </Badge>
          </div>
        )}
        
        {shift && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar size={14} className="mr-2" />
              <span>{new Date(shift.date).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <Clock size={14} className="mr-2" />
              <span>{shift.startTime} - {shift.endTime}</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <MapPin size={14} className="mr-2" />
              <span className="truncate">{shift.location}</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <DollarSign size={14} className="mr-2" />
              <span>${shift.payRate.toFixed(2)}/hr</span>
            </div>
          </div>
        )}
        
        <div className="pt-2">
          {!isTracking ? (
            <Button 
              onClick={handleStartTracking} 
              className="w-full"
              variant="default"
              disabled={loading}
            >
              {loading ? (
                <>Verifying Location...</>
              ) : (
                <>
                  <PlayCircle size={18} className="mr-2" />
                  Start Tracking
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleStopTracking} 
              className="w-full"
              variant="outline"
            >
              <StopCircle size={18} className="mr-2" />
              Stop Tracking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
