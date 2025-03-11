
import { Shift } from "../../shifts/ShiftCard";

type TimeDisplayProps = {
  elapsedTime: number;
  earnings: number;
  shift?: Shift;
  isTracking: boolean;
};

export const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
  
  return parts.join(', ');
};

export const formatBHD = (amount: number) => {
  return `BHD ${(amount * 0.377).toFixed(3)}`; // Converting USD to BHD (1 USD ≈ 0.377 BHD)
};

export default function TimeDisplay({ elapsedTime, earnings, shift, isTracking }: TimeDisplayProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-6 flex flex-col items-center justify-center">
      <div className="text-4xl font-mono font-semibold mb-2">
        {formatTime(elapsedTime)}
      </div>
      {isTracking && shift && (
        <div className="text-muted-foreground text-sm mt-1">
          Current earnings: {formatBHD(earnings)}
        </div>
      )}
    </div>
  );
}
