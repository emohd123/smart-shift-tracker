
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PromoterOption } from "../ShiftForm";
import { ShiftStatus } from "@/types/database";
import { DateRange } from "react-day-picker";

export default function useShiftForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    dateRange: undefined as DateRange | undefined,
    startTime: "09:00",
    endTime: "17:00",
    payRate: "15",
    payRateType: "hour",
    selectedPromoterId: ""
  });

  // Fetch promoters for assignment
  useEffect(() => {
    const fetchPromoters = async () => {
      setLoadingPromoters(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'promoter');
        
        if (error) throw error;
        
        if (data) {
          // Need to add email to match our PromoterOption interface
          // Since email is not available in profiles table, we'll use email placeholder
          const promotersWithEmail = data.map(promoter => ({
            ...promoter,
            email: `promoter-${promoter.id.substring(0, 6)}@example.com`
          }));
          
          setPromoters(promotersWithEmail as PromoterOption[]);
        }
      } catch (error) {
        console.error("Error fetching promoters:", error);
        toast({
          title: "Error",
          description: "Failed to load promoters",
          variant: "destructive"
        });
      } finally {
        setLoadingPromoters(false);
      }
    };

    fetchPromoters();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setFormData({
      ...formData,
      dateRange: range
    });
  };

  const handlePayRateTypeChange = (value: string) => {
    setFormData({
      ...formData,
      payRateType: value
    });
  };

  const handlePromoterSelect = (value: string) => {
    setFormData({
      ...formData,
      selectedPromoterId: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

  return {
    formData,
    loading,
    loadingPromoters,
    promoters,
    handleInputChange,
    handleDateRangeChange,
    handlePayRateTypeChange,
    handlePromoterSelect,
    handleSubmit
  };
}
