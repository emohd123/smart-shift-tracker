
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import TimeDisplay from "./TimeDisplay";
import LocationVerification from "./LocationVerification";
import LocationError from "./LocationError";
import TrackingControls from "./TrackingControls";

type TimeTrackerCardProps = {
  isTracking: boolean;
  startTime: Date | null;
  elapsedTime: number;
  earnings: number;
  locationVerified: boolean;
  showLocationError: boolean;
  loading: boolean;
  isNotActiveShift: boolean;
  handleStartTracking: () => void;
  handleStopTracking: () => void;
  autoStart?: boolean;
  autoStop?: boolean;
};

const TimeTrackerCard = ({
  isTracking,
  startTime,
  elapsedTime,
  earnings,
  locationVerified,
  showLocationError,
  loading,
  isNotActiveShift,
  handleStartTracking,
  handleStopTracking,
  autoStart,
  autoStop
}: TimeTrackerCardProps) => {
  return (
    <Card className={cn(
      "border border-border/50 transition-all duration-300",
      isTracking && "border-primary/20 shadow-md"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Time Tracker</CardTitle>
          {isTracking && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center">
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
          isTracking={isTracking}
        />
        
        <LocationVerification
          locationVerified={locationVerified}
          showLocationError={showLocationError}
        />
        
        {showLocationError && <LocationError />}
        
        {!autoStart && !autoStop && (
          <TrackingControls
            isTracking={isTracking}
            onStartTracking={handleStartTracking}
            onStopTracking={handleStopTracking}
            loading={loading}
            isShiftActive={!isNotActiveShift}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TimeTrackerCard;
