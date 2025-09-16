
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { TenantContext } from "@/hooks/useCurrentTenant";
import { supabase, enhancedQuery } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { ShiftFormData } from "../types/ShiftTypes";

export default function useShiftSubmission() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantContext = useContext(TenantContext);

  const submitShift = async (formData: ShiftFormData, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      setLoading(true);
      
      // Debug authentication state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Current session:", session);
      console.log("Current user:", user);
      console.log("Session error:", sessionError);
      
      if (!session) {
        toast.error("Authentication required. Please log in again.");
        return;
      }
      
      if (!formData.dateRange?.from) {
        toast.error("Start date is required");
        return;
      }
      
      // Get both employer_id and tenant_id for compatibility with new multi-tenant system
      const employerId = session.user?.id ?? user?.id ?? null;
      const tenantId = tenantContext?.currentTenant?.id || null;
      
      // Debug tenant context
      console.log("Tenant context:", tenantContext);
      console.log("Current tenant ID:", tenantId);
      console.log("User role:", tenantContext?.userRole);

      // Format the data for database with both IDs for backward compatibility
      const shiftData: TablesInsert<'shifts'> = {
        title: formData.title,
        location: formData.location,
        date: formData.dateRange.from.toISOString().split('T')[0],
        end_date: formData.dateRange.to ? formData.dateRange.to.toISOString().split('T')[0] : null,
        start_time: formData.startTime,
        end_time: formData.endTime,
        pay_rate: formData.payRate ? parseFloat(formData.payRate) : null,
        // ensure undefined becomes null for optional nullable fields
        pay_rate_type: (formData.payRateType ?? null) as TablesInsert<'shifts'>['pay_rate_type'],
        status: 'scheduled',
        employer_id: employerId,
        // Include tenant_id for multi-tenant system
        tenant_id: tenantId
      };
      
      console.log("Submitting shift:", shiftData);
      
      // Insert the shift using enhancedQuery to avoid TS overload issues
      let shiftId: string | undefined;
      try {
        const created = await enhancedQuery.insert<TablesInsert<'shifts'>>( 'shifts', shiftData);
        const first = Array.isArray(created) ? created[0] : undefined;
        const hasId = (row: unknown): row is { id: string } => {
          if (!row || typeof row !== 'object') return false;
          const maybe = row as Record<string, unknown>;
          return typeof maybe.id === 'string';
        };
        if (hasId(first)) shiftId = first.id;
      } catch (shiftErr: unknown) {
        console.error("Shift insert error:", shiftErr);
        const message = shiftErr instanceof Error ? shiftErr.message : String(shiftErr);
        
        let tailored = message;
        if (message.includes('row-level security')) {
          if (!tenantId) {
            tailored = 'Cannot create shift: No active tenant found. Please ensure you are a member of a company.';
          } else if (!tenantContext?.userRole || !['company_admin', 'company_manager'].includes(tenantContext.userRole)) {
            tailored = 'Cannot create shift: You need company admin or manager permissions.';
          } else {
            tailored = 'Cannot create shift: Permission denied. Please contact your administrator.';
          }
        } else if (message.includes('tenant_id')) {
          tailored = 'Cannot create shift: Invalid tenant association. Please try logging out and back in.';
        } else if (message.includes('employer_id')) {
          tailored = 'Cannot create shift: Authentication error. Please try logging out and back in.';
        }
        
        throw new Error(tailored);
      }

      if (!shiftId) {
        throw new Error('Failed to create shift. No ID returned.');
      }
      
      console.log("Shift created with ID:", shiftId);
      
      // If promoters were selected, assign them to the shift
      if (formData.selectedPromoterIds.length > 0) {
        const promoterAssignments: TablesInsert<'shift_assignments'>[] = formData.selectedPromoterIds.map((promoterId) => ({
          shift_id: shiftId,
          promoter_id: promoterId
        }));
        
        console.log("Creating promoter assignments:", promoterAssignments);
        try {
          await enhancedQuery.insert<TablesInsert<'shift_assignments'>>('shift_assignments', promoterAssignments);
          console.log("Successfully assigned promoters to shift");
        } catch (assignmentError: unknown) {
          console.error("Error assigning promoters:", assignmentError);
          toast.error("Shift created but there was an error assigning promoters");
        }
      }
      
      // Show success message and redirect
      toast.success("Shift created successfully");
      navigate("/shifts");
      
    } catch (error: unknown) {
      console.error("Error submitting shift:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create shift. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { submitShift, loading };
}
