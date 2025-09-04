
import { formatBHD } from "../../shifts/utils/currencyUtils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TimeDisplayProps = {
  elapsedTime: number;
  earnings: number;
  isTracking: boolean;
  shift?: any;
};

export const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
};

export default function TimeDisplay({ elapsedTime, earnings, isTracking }: TimeDisplayProps) {
  // Split the time for individual animations
  const formattedTime = formatTime(elapsedTime);
  const [hours, minutes, seconds] = formattedTime.split(':');
  
  return (
    <div className={cn(
      "bg-muted/50 rounded-lg p-6 flex flex-col items-center justify-center",
      "transition-all duration-300",
      isTracking && "bg-primary/10"
    )}>
      <div className="flex items-center justify-center text-4xl font-mono font-semibold mb-2">
        <TimeUnit value={hours} isTracking={isTracking} />
        <span className={isTracking ? "text-primary" : "text-muted-foreground"}>:</span>
        <TimeUnit value={minutes} isTracking={isTracking} />
        <span className={isTracking ? "text-primary" : "text-muted-foreground"}>:</span>
        <TimeUnit value={seconds} isTracking={isTracking} flipActive={isTracking} />
      </div>
      
      {earnings > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-muted-foreground text-sm mt-2"
        >
          <span>Current earnings: </span>
          <span className={isTracking ? "text-primary font-medium" : ""}>
            {formatBHD(earnings)}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// Individual time unit component for animation
function TimeUnit({ value, isTracking, flipActive = false }: { 
  value: string, 
  isTracking: boolean,
  flipActive?: boolean
}) {
  return (
    <div className="relative w-[2ch] text-center">
      {flipActive && isTracking ? (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-primary"
        >
          {value}
        </motion.div>
      ) : (
        <span className={isTracking ? "text-primary" : "text-foreground"}>
          {value}
        </span>
      )}
    </div>
  );
}
