
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PromoterOption } from "../ShiftForm";
import { ShiftStatus } from "@/types/database";

export default function useShiftForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [promoters, setPromoters] = useState<PromoterOption[]>([]);
  const [loadingPromoters, setLoadingPromoters] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "17:00",
    payRate: "15",
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

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({
        ...formData,
        date
      });
    }
  };

  const handlePromoterSelect = (value: string) => {
    setFormData({
      ...formData,
      selectedPromoterId: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.location || !formData.date || !formData.startTime || !formData.endTime || !formData.payRate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Format date to ISO string yyyy-mm-dd
      const formattedDate = format(formData.date, 'yyyy-MM-dd');
      
      // Insert the shift
      const { data: shiftData, error: shiftError } = await supabase
        .from('shifts')
        .insert({
          title: formData.title,
          location: formData.location,
          date: formattedDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          pay_rate: parseFloat(formData.payRate),
          status: ShiftStatus.Upcoming
        })
        .select('id')
        .single();

      if (shiftError) throw shiftError;
      
      // If a promoter was selected, assign them to the shift
      if (formData.selectedPromoterId && shiftData) {
        const { error: assignmentError } = await supabase
          .from('shift_assignments')
          .insert({
            shift_id: shiftData.id,
            promoter_id: formData.selectedPromoterId
          });

        if (assignmentError) throw assignmentError;
        
        // Create notification for the promoter
        await supabase
          .from('notifications')
          .insert({
            user_id: formData.selectedPromoterId,
            title: "New Shift Assignment",
            message: `You have been assigned to a new shift: ${formData.title}`,
            type: "shift_assignment",
            related_id: shiftData.id
          });
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
    handleDateChange,
    handlePromoterSelect,
    handleSubmit
  };
}
