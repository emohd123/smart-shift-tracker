
import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { tooltips } from "@/config/tooltips";

type TrackingControlsProps = {
  isTracking: boolean;
  onStartTracking: () => void | Promise<void>;
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => void onStartTracking()}
              className="flex-1 group transition-all duration-300"
              variant="default"
              disabled={loading || !isShiftActive}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Verifying Location...
                </>
              ) : (
                <>
                  <PlayCircle size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                  Start Tracking Time
                </>
              )}
            </Button>
            <HelpTooltip content={tooltips.partTimer.timeTracking.checkIn} side="left" />
          </div>
          {!isShiftActive && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This shift is not active or has already been completed
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2">
            <Button 
              onClick={onStopTracking} 
              className="flex-1 group"
              variant="outline"
              size="lg"
            >
              <StopCircle size={18} className="mr-2 text-destructive group-hover:scale-110 transition-transform" />
              Stop Tracking
            </Button>
            <HelpTooltip content={tooltips.partTimer.timeTracking.checkOut} side="left" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
