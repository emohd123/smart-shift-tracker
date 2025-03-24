
import { useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { TimePeriod } from "../types/certificate";

// Mock data for demo purposes
const MOCK_SHIFTS = [
  { 
    date: "2023-12-15", 
    title: "Product Demo at Central Mall", 
    hours: 8,
    location: "Central Mall, Downtown"
  },
  { 
    date: "2023-12-22", 
    title: "Brand Promotion at Tech Expo", 
    hours: 6,
    location: "Convention Center"
  },
  { 
    date: "2024-01-05", 
    title: "New Product Launch", 
    hours: 8,
    location: "City Plaza"
  },
  { 
    date: "2024-01-18", 
    title: "Sales Event Promotion", 
    hours: 9,
    location: "Westfield Mall"
  }
];

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
        // Return mock data for demo
        return [
          { id: "mock-1", full_name: "John Doe" },
          { id: "mock-2", full_name: "Jane Smith" },
          { id: "mock-3", full_name: "Robert Johnson" }
        ];
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
    // In a real implementation, we would query the time_logs and shifts tables
    // to get the actual completed shifts for the user within the time period
    
    try {
      // Attempt to fetch real time logs for the user
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
        console.log("Using mock data for shifts");
        // If no data or error, use mock data
        const timePeriodLabel = getTimePeriodLabel(timePeriod);
        
        // Simulate different numbers of shifts based on time period
        const filteredShifts = timePeriod === "3months" 
          ? MOCK_SHIFTS.slice(0, 2) 
          : timePeriod === "6months" 
            ? MOCK_SHIFTS.slice(0, 3)
            : MOCK_SHIFTS;
            
        return {
          shifts: filteredShifts,
          timePeriodLabel
        };
      }
      
      // Process actual time logs
      const processedShifts = await Promise.all(timeLogs.map(async (log) => {
        // Get shift details
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('title, location')
          .eq('id', log.shift_id)
          .single();
          
        return {
          date: format(new Date(log.check_in_time), "yyyy-MM-dd"),
          title: shiftData?.title || "Shift Work",
          hours: log.total_hours || 4,
          location: shiftData?.location || "Unknown Location"
        };
      }));
      
      return {
        shifts: processedShifts,
        timePeriodLabel: getTimePeriodLabel(timePeriod)
      };
    } catch (error) {
      console.error("Error fetching shifts:", error);
      
      // Fallback to mock data
      return {
        shifts: MOCK_SHIFTS,
        timePeriodLabel: getTimePeriodLabel(timePeriod)
      };
    }
  }, []);

  return {
    fetchCompletedShifts
  };
};
