
import { useCallback } from "react";
import { Shift } from "../../shifts/ShiftCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useTimeLogs(shift?: Shift) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Check for existing time logs for this shift
  const checkExistingTimeLog = useCallback(async (shiftId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('shift_id', shiftId)
        .eq('user_id', userId)
        .is('check_out_time', null)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking time logs:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error checking existing time logs:", error);
      return null;
    }
  }, []);

  // Create a new time log entry
  const createTimeLog = useCallback(async (checkInTime: Date) => {
    if (!shift || !user) return null;
    
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .insert({
          user_id: user.id,
          shift_id: shift.id,
          check_in_time: checkInTime.toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error creating time log:", error);
        toast({
          title: "Error",
          description: "Could not create time log entry.",
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error creating time log:", error);
      return null;
    }
  }, [shift, user, toast]);

  // Update an existing time log with check-out data
  const updateTimeLog = useCallback(async (
    timeLogId: string, 
    checkOutTime: Date, 
    hours: number, 
    hourlyRate: number
  ) => {
    try {
      const { error } = await supabase
        .from('time_logs')
        .update({
          check_out_time: checkOutTime.toISOString(),
          total_hours: hours,
          earnings: hourlyRate * hours
        })
        .eq('id', timeLogId);
      
      if (error) {
        console.error("Error updating time log:", error);
        toast({
          title: "Error",
          description: "Could not update time log entry.",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error updating time log:", error);
      return false;
    }
  }, [toast]);

  // Combined function to log time entry (create new or update existing)
  const logTimeEntry = useCallback(async (
    shiftId: string, 
    timeLogId: string | null, 
    isTracking: boolean, 
    startTime: Date | null, 
    elapsedTime: number
  ) => {
    if (!user) return;
    
    try {
      if (timeLogId) {
        // Update existing time log with check-out time
        const checkOutTime = new Date();
        const hours = elapsedTime / 3600;
        
        await updateTimeLog(
          timeLogId, 
          checkOutTime, 
          hours, 
          shift ? shift.payRate : 0
        );
      } else if (isTracking) {
        // Create new time log entry
        const checkInTime = startTime || new Date();
        const checkOutTime = new Date();
        const hours = elapsedTime / 3600;
        
        await supabase
          .from('time_logs')
          .insert({
            user_id: user.id,
            shift_id: shiftId,
            check_in_time: checkInTime.toISOString(),
            check_out_time: checkOutTime.toISOString(),
            total_hours: hours,
            earnings: shift ? hours * shift.payRate : 0
          });
      }
    } catch (error) {
      console.error("Error logging time entry:", error);
      toast({
        title: "Error",
        description: "Could not save your time entry.",
        variant: "destructive"
      });
    }
  }, [shift, user, toast, updateTimeLog]);

  return {
    checkExistingTimeLog,
    createTimeLog,
    updateTimeLog,
    logTimeEntry
  };
}
