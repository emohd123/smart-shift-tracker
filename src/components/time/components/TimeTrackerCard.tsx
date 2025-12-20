
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import TimeDisplay from "./TimeDisplay";
import LocationVerification from "./LocationVerification";
import LocationError from "./LocationError";
import TrackingControls from "./TrackingControls";
import { AlertCircle, X, Clock, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
  handleStartTracking: () => void | Promise<void>;
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
      className="h-full"
    >
      <Card className={cn(
        "border transition-all duration-500 h-full",
        isTracking 
          ? "border-primary/30 shadow-lg bg-gradient-to-br from-card to-primary/5" 
          : "border-border/50 shadow-sm hover:border-primary/20 hover:shadow-md"
      )}>
        <CardHeader className={cn(
          "pb-3 relative",
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
          <CardDescription className="flex items-center">
            {isTracking ? (
              <>
                <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                <span>Started at {startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            ) : (
              "Track your work hours and earnings in real-time"
            )}
          </CardDescription>
          
          {isTracking && (
            <div className="absolute right-0 top-0 h-12 w-12 overflow-hidden">
              <div className="bg-primary/10 rotate-45 transform origin-bottom-right h-24 w-24"></div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={isTracking ? "tracking" : "not-tracking"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TimeDisplay
                elapsedTime={elapsedTime}
                earnings={earnings}
                isTracking={isTracking}
              />
            </motion.div>
          </AnimatePresence>
          
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
