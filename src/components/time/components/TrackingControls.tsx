
import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle } from "lucide-react";

type TrackingControlsProps = {
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  loading: boolean;
  isShiftActive: boolean;
};

export default function TrackingControls({ 
  isTracking, 
  onStartTracking, 
  onStopTracking, 
  loading,
  isShiftActive
}: TrackingControlsProps) {
  return (
    <div className="pt-2">
      {!isTracking ? (
        <Button 
          onClick={onStartTracking} 
          className="w-full"
          variant="default"
          disabled={loading || !isShiftActive}
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
          onClick={onStopTracking} 
          className="w-full"
          variant="outline"
        >
          <StopCircle size={18} className="mr-2" />
          Stop Tracking
        </Button>
      )}
    </div>
  );
}
