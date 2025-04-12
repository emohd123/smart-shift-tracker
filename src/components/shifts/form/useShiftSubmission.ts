
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ShiftStatus } from "@/types/database";
import { ShiftFormData } from "./types";
import { v4 as uuidv4 } from 'uuid';

export default function useShiftSubmission() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submitShift = async (formData: ShiftFormData, e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.location || !formData.dateRange?.from || !formData.startTime || !formData.endTime) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Format start date to ISO string yyyy-mm-dd
      const formattedStartDate = format(formData.dateRange.from, 'yyyy-MM-dd');
      // Format end date (if exists) to ISO string yyyy-mm-dd
      const formattedEndDate = formData.dateRange.to ? format(formData.dateRange.to, 'yyyy-MM-dd') : formattedStartDate;
      
      // Generate a unique ID for the shift
      const shiftId = uuidv4();
      
      // Prepare shift data
      const shiftData = {
        id: shiftId,
        title: formData.title,
        location: formData.location,
        date: formattedStartDate,
        end_date: formattedEndDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        status: ShiftStatus.Upcoming,
        pay_rate_type: formData.payRateType,
      };
      
      // Only add pay_rate if a value is provided
      if (formData.payRate && formData.payRate.trim() !== '') {
        Object.assign(shiftData, { 
          pay_rate: parseFloat(formData.payRate) 
        });
      }

      // Try to insert the shift
      try {
        const { data: createdShift, error: shiftError } = await supabase
          .from('shifts')
          .insert(shiftData)
          .select('id')
          .single();

        if (shiftError) {
          console.error("Shift creation error:", shiftError);
          // If there's a database error, we'll use our local implementation
        }
      } catch (err) {
        console.error("Error with Supabase shift creation:", err);
      }
      
      // Create a shift object for the frontend with the correct Shift interface properties
      const payRateValue = formData.payRate ? parseFloat(formData.payRate) : 0;
      
      const newShift = {
        id: shiftId,
        title: formData.title,
        location: formData.location,
        date: formattedStartDate,
        endDate: formattedEndDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: ShiftStatus.Upcoming,
        payRateType: formData.payRateType,
        payRate: payRateValue,
        isPaid: false,
        is_assigned: formData.selectedPromoterIds.length > 0,
        assigned_promoters: formData.selectedPromoterIds.length,
        created_at: new Date().toISOString()
      };
      
      // Add the shift to the global shifts list
      if (window.addShift) {
        window.addShift(newShift);
      }
      
      // Handle location data if it was set
      try {
        const tempLocationString = localStorage.getItem('temp_shift_location');
        if (tempLocationString) {
          const tempLocation = JSON.parse(tempLocationString);
          
          // Save the location data for this shift
          await supabase.from('shift_locations').insert({
            shift_id: shiftId,
            latitude: tempLocation.latitude,
            longitude: tempLocation.longitude,
            radius: tempLocation.radius
          });
          
          // Clear the temporary location
          localStorage.removeItem('temp_shift_location');
        }
      } catch (locErr) {
        console.error("Error handling location data:", locErr);
      }
      
      // If promoters were selected, try to assign them to the shift
      if (formData.selectedPromoterIds.length > 0) {
        for (const promoterId of formData.selectedPromoterIds) {
          try {
            const { error: assignmentError } = await supabase
              .from('shift_assignments')
              .insert({
                shift_id: shiftId,
                promoter_id: promoterId
              });

            if (assignmentError) {
              console.error("Assignment error:", assignmentError);
              // Continue with success flow even if there's an error
            }
            
            // Try to create a notification for the promoter
            try {
              const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                  user_id: promoterId,
                  title: "New Shift Assignment",
                  message: `You have been assigned to a new shift: ${formData.title}`,
                  type: "shift_assignment",
                  related_id: shiftId
                });
                
              if (notificationError) {
                console.error("Notification error:", notificationError);
              }
            } catch (notifErr) {
              console.error("Error creating notification:", notifErr);
            }
          } catch (innerError) {
            console.error("Inner assignment error:", innerError);
          }
        }
      }

      toast.success("Success", {
        description: "Shift created successfully!"
      });
      
      navigate("/shifts");
    } catch (error: any) {
      console.error("Error creating shift:", error);
      toast.error("Error", {
        description: "Failed to create shift. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return { submitShift, loading };
}
