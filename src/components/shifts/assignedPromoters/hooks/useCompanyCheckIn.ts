import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCompanyCheckIn = (shiftId: string, payRate: number, payRateType: string) => {
  const [loading, setLoading] = useState(false);

  const calculateEarnings = (hours: number): number => {
    switch (payRateType) {
      case 'hourly':
        return hours * payRate;
      case 'daily':
        return (hours / 8) * payRate;
      case 'monthly':
        return (hours / 160) * payRate;
      case 'fixed':
        return payRate;
      default:
        return hours * payRate;
    }
  };

  const checkIn = async (promoterId: string, promoterName: string) => {
    setLoading(true);
    try {
      // Check if already checked in
      const { data: existingLog } = await supabase
        .from("time_logs")
        .select("id")
        .eq("user_id", promoterId)
        .eq("shift_id", shiftId)
        .is("check_out_time", null)
        .maybeSingle();

      if (existingLog) {
        toast.error(`${promoterName} is already checked in`);
        return false;
      }

      const now = new Date();

      // Create time log
      const { error } = await supabase
        .from("time_logs")
        .insert({
          user_id: promoterId,
          shift_id: shiftId,
          check_in_time: now.toISOString(),
        });

      if (error) throw error;

      toast.success(`${promoterName} checked in successfully`);
      return true;
    } catch (error: any) {
      console.error("Error checking in:", error);
      toast.error("Failed to check in promoter");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkOut = async (timeLogId: string, promoterName: string, checkInTime: string) => {
    setLoading(true);
    try {
      const now = new Date();
      const checkIn = new Date(checkInTime);
      const hours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      const earnings = calculateEarnings(hours);

      const { error } = await supabase
        .from("time_logs")
        .update({
          check_out_time: now.toISOString(),
          total_hours: hours,
          earnings: earnings,
        })
        .eq("id", timeLogId);

      if (error) throw error;

      toast.success(`${promoterName} checked out: ${hours.toFixed(2)}h worked, BHD ${earnings.toFixed(3)} earned`);
      return true;
    } catch (error: any) {
      console.error("Error checking out:", error);
      toast.error("Failed to check out promoter");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { checkIn, checkOut, loading };
};
