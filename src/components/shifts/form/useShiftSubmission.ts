
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShiftStatus } from "@/types/database";
import { ShiftFormData } from "./types";

export default function useShiftSubmission() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submitShift = async (formData: ShiftFormData, e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.location || !formData.dateRange?.from || !formData.startTime || !formData.endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Format start date to ISO string yyyy-mm-dd
      const formattedStartDate = format(formData.dateRange.from, 'yyyy-MM-dd');
      // Format end date (if exists) to ISO string yyyy-mm-dd
      const formattedEndDate = formData.dateRange.to ? format(formData.dateRange.to, 'yyyy-MM-dd') : formattedStartDate;
      
      // Prepare shift data - handle pay_rate properly
      const shiftData = {
        title: formData.title,
        location: formData.location,
        date: formattedStartDate,
        end_date: formattedEndDate,
        start_time: formData.startTime,
        end_time: formData.endTime,
        status: ShiftStatus.Upcoming,
        pay_rate_type: formData.payRateType
      };
      
      // Only add pay_rate if a value is provided
      if (formData.payRate && formData.payRate.trim() !== '') {
        Object.assign(shiftData, { 
          pay_rate: parseFloat(formData.payRate) 
        });
      }

      // Insert the shift
      const { data: createdShift, error: shiftError } = await supabase
        .from('shifts')
        .insert(shiftData)
        .select('id')
        .single();

      if (shiftError) {
        console.error("Shift creation error:", shiftError);
        throw new Error(shiftError.message || "Failed to create shift");
      }
      
      // If a promoter was selected, assign them to the shift
      if (formData.selectedPromoterId && createdShift) {
        const { error: assignmentError } = await supabase
          .from('shift_assignments')
          .insert({
            shift_id: createdShift.id,
            promoter_id: formData.selectedPromoterId
          });

        if (assignmentError) {
          console.error("Assignment error:", assignmentError);
          throw new Error(assignmentError.message || "Failed to assign promoter");
        }
        
        // Create notification for the promoter
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: formData.selectedPromoterId,
            title: "New Shift Assignment",
            message: `You have been assigned to a new shift: ${formData.title}`,
            type: "shift_assignment",
            related_id: createdShift.id
          });
          
        if (notificationError) {
          console.error("Notification error:", notificationError);
          // Don't throw here, notification is not critical
        }
      }

      toast({
        title: "Success",
        description: "Shift created successfully!"
      });
      
      navigate("/shifts");
    } catch (error: any) {
      console.error("Error creating shift:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create shift",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return { submitShift, loading };
}
