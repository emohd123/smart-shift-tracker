
import { useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatShiftForDatabase, saveShiftsToLocalStorage } from "./utils/shiftDataUtils";
import { ShiftStatus } from "@/types/database";

interface UseShiftsAddProps {
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
}

export const useShiftsAdd = ({ setShifts }: UseShiftsAddProps) => {
  // Add a shift to the list
  const addShift = useCallback(async (shift: Shift) => {
    try {
      console.log("Adding shift:", shift);
      
      // First try to add to Supabase
      const formattedShift = formatShiftForDatabase(shift);
      const { data, error } = await supabase
        .from('shifts')
        .insert(formattedShift)
        .select()
        .single();
      
      if (error) {
        console.error('Error adding shift to database:', error);
        throw error;
      }
      
      console.log('Shift added to database successfully:', data);
      
      // If shift has location data, add it to the shift_locations table
      const locationData = localStorage.getItem('temp_shift_location');
      if (locationData) {
        try {
          const locationInfo = JSON.parse(locationData);
          const { error: locationError } = await supabase
            .from('shift_locations')
            .insert({
              shift_id: shift.id,
              latitude: locationInfo.latitude,
              longitude: locationInfo.longitude,
              radius: locationInfo.radius || 100
            });
            
          if (locationError) {
            console.error('Error adding shift location:', locationError);
          } else {
            console.log('Shift location added successfully');
            localStorage.removeItem('temp_shift_location');
          }
        } catch (locErr) {
          console.error('Error processing location data:', locErr);
        }
      }
      
      // Then update local state with the data from the database
      // This ensures we're using the exact data that was saved
      const freshShift: Shift = {
        id: data.id,
        title: data.title,
        date: data.date,
        endDate: data.end_date,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location,
        status: data.status as ShiftStatus, // Cast to ShiftStatus enum
        payRate: data.pay_rate || 0,
        payRateType: data.pay_rate_type || 'hour',
        isPaid: data.is_paid || false,
        is_assigned: false,
        assigned_promoters: 0,
        created_at: data.created_at
      };
      
      setShifts(prev => [freshShift, ...prev]);
      
      // Only save to localStorage as fallback if database save succeeded
      // This prevents having inconsistent data
      saveShiftsToLocalStorage(freshShift);
      
      toast.success("Shift added successfully", {
        description: "The shift has been added to the database"
      });
    } catch (error) {
      console.error('Error adding shift:', error);
      toast.error("Failed to add shift to database", {
        description: "Saving locally only as fallback"
      });
      
      // If database save fails, at least update local state
      setShifts(prev => [shift, ...prev]);
      saveShiftsToLocalStorage(shift);
    }
  }, [setShifts]);

  return {
    addShift
  };
};
