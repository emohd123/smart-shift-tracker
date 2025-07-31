import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TimePeriod, WorkExperienceData } from "../types/certificate";
import { useUserData } from "./useShiftData";
import { v4 as uuidv4 } from "uuid";

export const useWorkExperienceData = () => {
  const [loading, setLoading] = useState(false);
  const { fetchUserData } = useUserData();

  const fetchWorkExperienceData = useCallback(async (
    userId: string, 
    timePeriod: TimePeriod
  ): Promise<WorkExperienceData | null> => {
    setLoading(true);
    
    try {
      // Get user name
      const userName = await fetchUserData(userId);
      
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timePeriod) {
        case "3months":
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case "6months":
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case "1year":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case "all":
          startDate = new Date("2020-01-01"); // Start from a reasonable past date
          break;
      }

      // Fetch time logs with actual work data
      const { data: timeLogs, error: timeLogsError } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('check_in_time', startDate.toISOString())
        .lte('check_in_time', endDate.toISOString())
        .not('check_out_time', 'is', null)
        .order('check_in_time', { ascending: true });

      if (timeLogsError) {
        console.error('Error fetching time logs:', timeLogsError);
      }

      // Fetch shifts for additional context
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (shiftsError) {
        console.error('Error fetching shifts:', shiftsError);
      }

      // Process and combine data
      const processedShifts = [];
      const rolesSet = new Set<string>();
      const locationsSet = new Set<string>();
      let totalHours = 0;
      let totalTrackedHours = 0;

      // Process time logs (actual worked hours)
      const timeLogsByDate = new Map();
      if (timeLogs) {
        timeLogs.forEach(log => {
          const date = new Date(log.check_in_time).toISOString().split('T')[0];
          const hours = log.total_hours || 0;
          totalTrackedHours += hours;
          
          timeLogsByDate.set(date, {
            checkIn: new Date(log.check_in_time).toLocaleTimeString(),
            checkOut: log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString() : '',
            actualHours: hours,
            shiftId: log.shift_id
          });
        });
      }

      // Process shifts (scheduled work)
      if (shifts) {
        shifts.forEach(shift => {
          const shiftDate = shift.date;
          const timeLog = timeLogsByDate.get(shiftDate);
          
          // Calculate shift duration (default 8 hours if no time log)
          const startTime = new Date(`${shiftDate}T${shift.start_time}`);
          const endTime = new Date(`${shiftDate}T${shift.end_time}`);
          const scheduledHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          
          const actualHours = timeLog?.actualHours || scheduledHours;
          totalHours += actualHours;

          rolesSet.add(shift.title);
          locationsSet.add(shift.location);

          processedShifts.push({
            date: new Date(shiftDate).toLocaleDateString(),
            title: shift.title,
            hours: actualHours,
            location: shift.location,
            timeLog: timeLog
          });
        });
      }

      // Calculate performance metrics
      const averageHoursPerShift = processedShifts.length > 0 ? totalTrackedHours / processedShifts.length : 0;
      
      // Find most productive day (day with highest hours)
      const hoursPerDay = new Map();
      processedShifts.forEach(shift => {
        const dayOfWeek = new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long' });
        hoursPerDay.set(dayOfWeek, (hoursPerDay.get(dayOfWeek) || 0) + shift.hours);
      });
      
      const mostProductiveDay = Array.from(hoursPerDay.entries())
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';

      // Generate work experience data
      const workExperienceData: WorkExperienceData = {
        referenceNumber: `WE-${uuidv4().substring(0, 8).toUpperCase()}`,
        promoterName: typeof userName === 'string' ? userName : userName?.full_name || 'Unknown User',
        totalHours: Math.round(totalHours * 100) / 100,
        totalShifts: processedShifts.length,
        workPeriod: {
          startDate: processedShifts.length > 0 
            ? processedShifts[0].date 
            : startDate.toLocaleDateString(),
          endDate: processedShifts.length > 0 
            ? processedShifts[processedShifts.length - 1].date 
            : endDate.toLocaleDateString()
        },
        roles: Array.from(rolesSet),
        locations: Array.from(locationsSet),
        shifts: processedShifts,
        timeLogs: {
          totalTrackedHours: Math.round(totalTrackedHours * 100) / 100,
          averageHoursPerShift: Math.round(averageHoursPerShift * 100) / 100,
          mostProductiveDay
        },
        issueDate: new Date().toLocaleDateString(),
        managerContact: "555-123-4567",
        performanceRating: Math.min(5, Math.max(3, Math.round((totalTrackedHours / (processedShifts.length * 8)) * 5))),
        certificateType: "work_experience"
      };

      return workExperienceData;
    } catch (error) {
      console.error('Error fetching work experience data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUserData]);

  return {
    fetchWorkExperienceData,
    loading
  };
};