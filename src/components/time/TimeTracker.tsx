
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shift } from "../shifts/ShiftCard";
import { cn } from "@/lib/utils";
import { useTimeTracking } from "./hooks/useTimeTracking";
import TimeDisplay from "./components/TimeDisplay";
import LocationVerification from "./components/LocationVerification";
import ShiftDetails from "./components/ShiftDetails";
import LocationError from "./components/LocationError";
import TrackingControls from "./components/TrackingControls";
import { forwardRef, useImperativeHandle } from "react";

type TimeTrackerProps = {
  shift?: Shift;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
};

const TimeTracker = forwardRef(({ shift, onCheckIn, onCheckOut }: TimeTrackerProps, ref) => {
  const {
    isTracking,
    elapsedTime,
    earnings,
    startTime,
    loading,
    locationVerified,
    showLocationError,
    isNotActiveShift,
    handleStartTracking,
    handleStopTracking
  } = useTimeTracking(shift, onCheckIn, onCheckOut);
  
  // Expose the handleStartTracking method to parent components
  useImperativeHandle(ref, () => ({
    handleStartTracking
  }));
  
  return (
    <Card className={cn(
      "border border-border/50 transition-all duration-300",
      isTracking && "border-primary/20 shadow-md"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Time Tracker</CardTitle>
          {isTracking && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Active
            </Badge>
          )}
        </div>
        <CardDescription>
          {isTracking 
            ? `Started at ${startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : "Track your work hours and earnings"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <TimeDisplay
          elapsedTime={elapsedTime}
          earnings={earnings}
          shift={shift}
          isTracking={isTracking}
        />
        
        <LocationVerification
          locationVerified={locationVerified}
          showLocationError={showLocationError}
        />
        
        {showLocationError && <LocationError />}
        
        {shift && <ShiftDetails shift={shift} />}
        
        <TrackingControls
          isTracking={isTracking}
          onStartTracking={handleStartTracking}
          onStopTracking={handleStopTracking}
          loading={loading}
          isShiftActive={!isNotActiveShift}
        />
      </CardContent>
    </Card>
  );
});

TimeTracker.displayName = "TimeTracker";

export default TimeTracker;
