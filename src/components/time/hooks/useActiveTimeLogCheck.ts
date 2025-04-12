
import { useEffect } from "react";
import { Shift } from "../../shifts/types/ShiftTypes";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/context/AuthContext";

type UseActiveTimeLogCheckProps = {
  shift?: Shift;
  user: User | null;
  checkExistingTimeLog: (shiftId: string, userId: string) => Promise<any>;
  setTimeLogId: (id: string | null) => void;
  setStartTime: (time: Date | null) => void;
  setIsTracking: (tracking: boolean) => void;
  setLocationVerified: (verified: boolean) => void;
  setElapsedTime: (time: number) => void;
};

export function useActiveTimeLogCheck({
  shift,
  user,
  checkExistingTimeLog,
  setTimeLogId,
  setStartTime,
  setIsTracking,
  setLocationVerified,
  setElapsedTime
}: UseActiveTimeLogCheckProps) {
  const { toast } = useToast();
  
  // Check if there's an active time log for this shift when component mounts
  useEffect(() => {
    if (shift && user) {
      const fetchExistingTimeLog = async () => {
        try {
          const data = await checkExistingTimeLog(shift.id, user.id);
          
          if (data) {
            // We have an active time log, so let's resume tracking
            setTimeLogId(data.id);
            setStartTime(new Date(data.check_in_time));
            setIsTracking(true);
            setLocationVerified(true);
            
            // Calculate elapsed time since check-in
            const startTimeMs = new Date(data.check_in_time).getTime();
            const nowMs = new Date().getTime();
            const elapsedSeconds = Math.floor((nowMs - startTimeMs) / 1000);
            setElapsedTime(elapsedSeconds);
            
            // Notify if returning to an active session
            if (startTimeMs < (nowMs - 60000)) { // Only notify if more than a minute has passed
              toast({
                title: "Session Resumed",
                description: `Continuing time tracking for ${shift.title}`,
              });
            }
          }
        } catch (error) {
          console.error("Error checking existing time logs:", error);
          toast({
            title: "Error",
            description: "Could not check for existing time logs. Please try again.",
            variant: "destructive"
          });
        }
      };
      
      fetchExistingTimeLog();
    }
  }, [shift, user, checkExistingTimeLog, setElapsedTime, toast, setTimeLogId, setStartTime, setIsTracking, setLocationVerified]);
}
