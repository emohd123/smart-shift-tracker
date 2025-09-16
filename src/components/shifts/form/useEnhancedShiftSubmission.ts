import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase, withRetry } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ShiftFormData } from "../types/ShiftTypes";

export default function useEnhancedShiftSubmission() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const submitShift = async (formData: ShiftFormData, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      setLoading(true);
      
      // Enhanced authentication check with retry
      const getAuthenticatedSession = async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error("Authentication error. Please log in again.");
        }
        
        if (!session) {
          throw new Error("Authentication required. Please log in again.");
        }
        
        return session;
      };

      const session = await withRetry(getAuthenticatedSession, 2);
      
      // Enhanced form validation
      if (!formData.dateRange?.from) {
        toast.error("Start date is required");
        return;
      }
      
      if (!formData.title?.trim()) {
        toast.error("Shift title is required");
        return;
      }
      
      if (!formData.location?.trim()) {
        toast.error("Location is required");
        return;
      }

      // Build payload matching current typed schema
      const shiftData: Database["public"]["Tables"]["shifts"]["Insert"] = {
        title: formData.title.trim(),
        location: formData.location.trim(),
        date: formData.dateRange.from.toISOString().split('T')[0],
        end_date: formData.dateRange.to ? formData.dateRange.to.toISOString().split('T')[0] : null,
        start_time: formData.startTime,
        end_time: formData.endTime,
        pay_rate: formData.payRate ? parseFloat(formData.payRate) : null,
        pay_rate_type: formData.payRateType || 'hour',
        status: 'scheduled',
        employer_id: session.user.id,
        created_at: new Date().toISOString()
      };
      
      console.log("Enhanced shift submission:", shiftData);
      
      // Use enhanced query for better error handling
      const insertShift = async () => {
        const { data: inserted, error: insertError } = await supabase
          .from('shifts')
          .insert(shiftData as Database["public"]["Tables"]["shifts"]["Insert"])
          .select('id')
          .single();
        if (insertError) throw insertError;
        return inserted as { id: string };
      };

  const shiftResult = await withRetry(insertShift, 2);
  const shiftId = (shiftResult as { id: string }).id;
      
      console.log("Enhanced shift created with ID:", shiftId);
      
      // Enhanced promoter assignments with better error handling
      if (formData.selectedPromoterIds.length > 0) {
        const assignPromoters = async () => {
          const legacyAssignments: Database["public"]["Tables"]["shift_assignments"]["Insert"][] =
            formData.selectedPromoterIds.map((promoterId) => ({
              shift_id: shiftId,
              promoter_id: promoterId,
            }));

          const { error: legacyError } = await supabase
            .from('shift_assignments')
            .insert(legacyAssignments as unknown as Database["public"]["Tables"]["shift_assignments"]["Insert"][]);

          if (legacyError) throw legacyError;
        };

        try {
          await withRetry(assignPromoters, 2);
        } catch (assignmentError) {
          console.error("Error assigning promoters:", assignmentError);
          toast.error("Shift created but there was an error assigning promoters");
        }
      }
      
      // Notifications omitted in this lightweight path
      
      // Enhanced success message
      const successMessage = formData.selectedPromoterIds.length > 0 
        ? `Shift "${shiftData.title}" created successfully with ${formData.selectedPromoterIds.length} promoter(s) assigned`
        : `Shift "${shiftData.title}" created successfully`;
        
      toast.success(successMessage);
      navigate("/shifts");
      
    } catch (error: unknown) {
  console.error("Error submitting shift:", error);
      
      // Enhanced error handling with specific error types
      let errorMessage = "Failed to create shift. Please try again.";
      
      if (error instanceof Error) {
        const errorCode = (error as Error & { code?: string }).code;
        
        if (errorCode === 'PGRST301') {
          errorMessage = "Permission denied. Please check your account permissions.";
        } else if (errorCode === '23505') {
          errorMessage = "A shift with similar details already exists.";
        } else if (errorCode === '23503') {
          errorMessage = "Invalid reference. Please check selected promoters.";
        } else if (error.message.includes('JWT')) {
          errorMessage = "Session expired. Please refresh the page and try again.";
        } else if (error.message.includes('tenant')) {
          errorMessage = "Account setup required. Please complete your profile.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      
  // Skip server logging in client path
    } finally {
      setLoading(false);
    }
  };

  const updateShift = async (shiftId: string, formData: Partial<ShiftFormData>) => {
    try {
      setLoading(true);
      
      const updateData: Database["public"]["Tables"]["shifts"]["Update"] = {
        updated_at: new Date().toISOString()
      };
      
      // Map form data to database fields
  if (formData.title) updateData.title = formData.title.trim();
  if (formData.location) updateData.location = formData.location.trim();
      if (formData.dateRange?.from) {
        updateData.date = formData.dateRange.from.toISOString().split('T')[0];
      }
      if (formData.dateRange?.to) {
        updateData.end_date = formData.dateRange.to.toISOString().split('T')[0];
      }
      if (formData.startTime) updateData.start_time = formData.startTime;
      if (formData.endTime) updateData.end_time = formData.endTime;
      if (formData.payRate) updateData.pay_rate = parseFloat(formData.payRate);
      if (formData.payRateType) updateData.pay_rate_type = formData.payRateType;

      const updateShift = async () => {
        const { data, error } = await supabase
          .from('shifts')
          .update(updateData as Database["public"]["Tables"]["shifts"]["Update"])
          .eq('id', shiftId)
          .select()
          .single();

        if (error) throw error;
        return data;
      };

      const updatedShift = await withRetry(updateShift, 2);

      toast.success("Shift updated successfully");
      return updatedShift;
      
    } catch (error: unknown) {
      console.error("Error updating shift:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update shift";
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { 
    submitShift, 
    updateShift,
    loading 
  };
}