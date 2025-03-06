
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Calendar, DollarSign, PlayCircle, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Shift } from "../shifts/ShiftCard";

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
  
  // Format seconds into HH:MM:SS
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
  
  // Calculate earnings based on elapsed time and pay rate
  useEffect(() => {
    if (shift && isTracking) {
      const hourlyRate = shift.payRate;
      const hours = elapsedTime / 3600;
      setEarnings(hours * hourlyRate);
    }
  }, [elapsedTime, shift, isTracking]);
  
  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTracking]);
  
  const handleStartTracking = () => {
    setIsTracking(true);
    setStartTime(new Date());
    
    toast({
      title: "Time Tracking Started",
      description: shift 
        ? `Now tracking time for ${shift.title}` 
        : "Your time is now being tracked",
    });
    
    if (onCheckIn) onCheckIn();
  };
  
  const handleStopTracking = () => {
    setIsTracking(false);
    
    toast({
      title: "Time Tracking Stopped",
      description: `You worked for ${formatTime(elapsedTime)} and earned $${earnings.toFixed(2)}`,
    });
    
    if (onCheckOut) onCheckOut();
    
    // Reset the timer after a delay to show the final time
    setTimeout(() => {
      setElapsedTime(0);
      setEarnings(0);
      setStartTime(null);
    }, 5000);
  };
  
  // Get current time in HH:MM format for display
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
        {/* Timer display */}
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
        
        {/* Shift details if provided */}
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
        
        {/* Controls */}
        <div className="pt-2">
          {!isTracking ? (
            <Button 
              onClick={handleStartTracking} 
              className="w-full"
              variant="default"
            >
              <PlayCircle size={18} className="mr-2" />
              Start Tracking
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
