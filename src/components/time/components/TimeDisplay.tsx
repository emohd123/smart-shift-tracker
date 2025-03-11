
import { formatBHD } from "../../shifts/utils/currencyUtils";

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
  return (
    <div className="bg-muted/50 rounded-lg p-6 flex flex-col items-center justify-center">
      <div className="text-4xl font-mono font-semibold mb-2">
        {formatTime(elapsedTime)}
      </div>
      {isTracking && (
        <div className="text-muted-foreground text-sm mt-1">
          Current earnings: {formatBHD(earnings)}
        </div>
      )}
    </div>
  );
}
