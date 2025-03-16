
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import TimeDisplay from "./TimeDisplay";
import LocationVerification from "./LocationVerification";
import LocationError from "./LocationError";
import TrackingControls from "./TrackingControls";
import { AlertCircle, X, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type TimeTrackerCardProps = {
  isTracking: boolean;
  startTime: Date | null;
  elapsedTime: number;
  earnings: number;
  locationVerified: boolean;
  showLocationError: boolean;
  permissionDenied?: boolean;
  loading: boolean;
  isNotActiveShift: boolean;
  handleStartTracking: () => void;
  handleStopTracking: () => void;
  handleDismissError?: () => void;
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
  permissionDenied,
  loading,
  isNotActiveShift,
  handleStartTracking,
  handleStopTracking,
  handleDismissError,
  autoStart,
  autoStop
}: TimeTrackerCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn(
        "border transition-all duration-500",
        isTracking 
          ? "border-primary/30 shadow-lg bg-gradient-to-br from-card to-primary/5" 
          : "border-border/50 shadow-sm"
      )}>
        <CardHeader className={cn(
          "pb-3",
          isTracking && "bg-primary/5"
        )}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className={cn(
                "h-5 w-5",
                isTracking ? "text-primary" : "text-muted-foreground"
              )} />
              Time Tracker
            </CardTitle>
            {isTracking && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center">
                  <span className="h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                  Active
                </Badge>
              </motion.div>
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
          
          {showLocationError && (
            <motion.div 
              className="relative"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <LocationError />
              {handleDismissError && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6" 
                  onClick={handleDismissError}
                >
                  <X size={14} />
                </Button>
              )}
            </motion.div>
          )}
          
          {permissionDenied && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Location permission denied. Please enable location access in your browser settings to track time.
              </AlertDescription>
            </Alert>
          )}
          
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
    </motion.div>
  );
};

export default TimeTrackerCard;
