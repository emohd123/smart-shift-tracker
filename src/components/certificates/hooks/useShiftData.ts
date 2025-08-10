
import { useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { TimePeriod } from "../types/certificate";


export interface ShiftData {
  date: string;
  title: string;
  hours: number;
  location?: string;
}

/**
 * Hook for fetching user profile data
 */
export const useUserData = () => {
  const fetchUserData = useCallback(async (targetUserId: string) => {
    if (!targetUserId) {
      return null;
    }
    
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', targetUserId)
        .single();
        
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return null;
      }
      
      return profileData;
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      return null;
    }
  }, []);

  const fetchPromoters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'promoter');
        
      if (error) {
        console.error("Error fetching promoters:", error);
        return [];

      }
      
      return data || [];
    } catch (error) {
      console.error("Error fetching promoters:", error);
      return [];
    }
  }, []);

  return {
    fetchUserData,
    fetchPromoters
  };
};

/**
 * Hook for fetching shift data
 */
export const useShiftData = () => {
  const getTimePeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case "3months": return "Last 3 Months";
      case "6months": return "Last 6 Months";
      case "1year": return "Last Year";
      case "all": return "All Time";
    }
  };

  const fetchCompletedShifts = useCallback(async (targetUserId: string, timePeriod: TimePeriod) => {
    try {
      const { data: timeLogs, error } = await supabase
        .from('time_logs')
        .select(`
          id,
          check_in_time,
          check_out_time,
          total_hours,
          shift_id
        `)
        .eq('user_id', targetUserId);
      
      if (error || !timeLogs || timeLogs.length === 0) {
        return {
          shifts: [],
          timePeriodLabel: getTimePeriodLabel(timePeriod)
        };
      }
      
      const processedShifts = await Promise.all(timeLogs.map(async (log) => {
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('title, location')
          .eq('id', log.shift_id)
          .single();
          
        return {
          date: format(new Date(log.check_in_time), "yyyy-MM-dd"),
          title: shiftData?.title || "Shift Work",
          hours: log.total_hours || 0,
          location: shiftData?.location || ""
        };
      }));
      
      return {
        shifts: processedShifts,
        timePeriodLabel: getTimePeriodLabel(timePeriod)
      };
    } catch (error) {
      console.error("Error fetching shifts:", error);
      return {
        shifts: [],
        timePeriodLabel: getTimePeriodLabel(timePeriod)
      };
    }
  }, []);

  return {
    fetchCompletedShifts
  };
};
