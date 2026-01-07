import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShiftFormData } from "../../types/ShiftTypes";
import { calculatePaymentSchedule, PaymentScheduleItem } from "../utils/paymentScheduleCalculator";
import { generateContractTemplate } from "../utils/contractTemplateGenerator";
import { findOverlappingShifts } from "@/utils/shiftOverlapCheck";
import { formatDateLocal } from "@/utils/dateUtils";

interface ShiftContractFormState {
  title: string;
  description: string;
  location: string;
  dateRange: { from?: Date; to?: Date };
  startTime: string;
  endTime: string;
  payRate: string;
  payRateType: "hourly" | "daily" | "fixed";
  assignedPromoters: Array<{
    id: string;
    fullName: string;
    uniqueCode: string;
    workHours: number;
    estimatedPay: number;
  }>;
  paymentDate: string;
  customPaymentTerms?: string;
  contractTerms?: string;
  contractTitle?: string;
  contractBody?: string;
}

export function useShiftContractForm(options?: { initialData?: ShiftFormData }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ShiftContractFormState>({
    title: options?.initialData?.title || "",
    description: "", // Initialize empty since ShiftFormData doesn't have it
    location: options?.initialData?.location || "",
    dateRange: options?.initialData?.dateRange || {},
    startTime: options?.initialData?.startTime || "09:00",
    endTime: options?.initialData?.endTime || "17:00",
    payRate: options?.initialData?.payRate || "0",
    payRateType: (options?.initialData?.payRateType as any) || "hourly",
    assignedPromoters: [],
    paymentDate: "",
    customPaymentTerms: "",
    contractTerms: "",
    contractTitle: "Shift Contract",
    contractBody: ""
  });

  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [contractPreview, setContractPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];

    if (!formData.title?.trim()) errors.push("Shift title is required");
    if (!formData.location?.trim()) errors.push("Location is required");
    if (!formData.dateRange?.from) errors.push("Start date is required");
    if (!formData.dateRange?.to) errors.push("End date is required");
    if (!formData.startTime) errors.push("Start time is required");
    if (!formData.endTime) errors.push("End time is required");
    if (!formData.payRate || parseFloat(formData.payRate) <= 0) errors.push("Valid pay rate is required");
    // Promoter assignment is optional - can be assigned later
    if (!formData.paymentDate) errors.push("Payment date is required");

    setValidationErrors(errors);
    return errors;
  }, [formData]);

  const handleDetailsChange = useCallback((updatedFields: Partial<ShiftContractFormState>) => {
    setFormData(prev => ({ ...prev, ...updatedFields }));
  }, []);

  const handleContractChange = useCallback((title: string, body: string) => {
    setFormData(prev => ({
      ...prev,
      contractTitle: title,
      contractBody: body
    }));
  }, []);

  const handlePaymentChange = useCallback((paymentDate: string, customTerms?: string) => {
    setFormData(prev => ({
      ...prev,
      paymentDate,
      customPaymentTerms: customTerms || ""
    }));

    // Calculate payment schedule
    if (formData.dateRange?.from && formData.dateRange?.to) {
      const schedule = calculatePaymentSchedule({
        shiftStartDate: formData.dateRange.from,
        shiftEndDate: formData.dateRange.to,
        paymentDate: new Date(paymentDate),
        assignedPromoters: formData.assignedPromoters,
        payRate: parseFloat(formData.payRate),
        payRateType: formData.payRateType
      });
      setPaymentSchedule(schedule);
    }
  }, [formData]);

  const handlePromoterChange = useCallback((promoters: Array<{ 
    id: string; 
    fullName: string; 
    uniqueCode: string; 
    workHours: number; 
    estimatedPay: number 
  }>) => {
    setFormData(prev => ({
      ...prev,
      assignedPromoters: promoters
    }));
  }, []);

  const generateContractPreview = useCallback(async () => {
    if (formData.dateRange?.from && formData.dateRange?.to) {
      // Fetch company profile for company details
      let companyName = "Company";
      if (user?.id) {
        try {
          // Try to fetch from company_profiles first (for company accounts)
          const { data: companyProfile } = await supabase
            .from("company_profiles")
            .select("name")
            .eq("user_id", user.id)
            .single();
          
          if (companyProfile?.name) {
            companyName = companyProfile.name;
          } else {
            // Fallback: fetch from profiles table
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", user.id)
              .single();
            
            if (userProfile?.full_name) {
              companyName = userProfile.full_name;
            }
          }
        } catch (error) {
          console.error("Error fetching company details:", error);
        }
      }

      const preview = generateContractTemplate({
        shiftTitle: formData.title,
        description: formData.description,
        location: formData.location,
        startDate: formData.dateRange.from,
        endDate: formData.dateRange.to,
        startTime: formData.startTime,
        endTime: formData.endTime,
        payRate: parseFloat(formData.payRate),
        payRateType: formData.payRateType,
        paymentDate: new Date(formData.paymentDate),
        promoterCount: formData.assignedPromoters.length,
        totalEstimatedPay: formData.assignedPromoters.reduce((sum, p) => sum + p.estimatedPay, 0),
        customTerms: formData.customPaymentTerms,
        companyName: companyName,
        companyId: user?.id
      });
      setContractPreview(preview);
      // Initialize contract body if not already set
      if (!formData.contractBody) {
        setFormData(prev => ({
          ...prev,
          contractBody: preview
        }));
      }
    }
  }, [formData, user?.id]);

  const submitShiftAndContract = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error("Please fix validation errors before submitting");
      return { success: false }; // Always return object
    }

    setLoading(true);
    try {
      if (!user?.id) throw new Error("Not authenticated");

      // Create shift - use the first date from the range as the shift date
      // Format date in local timezone to prevent timezone shifts
      const shiftDate = formData.dateRange.from ? formatDateLocal(formData.dateRange.from) : undefined;
      
      const { data: shiftData, error: shiftError } = await supabase
        .from("shifts")
        .insert({
          company_id: user.id,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          date: shiftDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          pay_rate: parseFloat(formData.payRate),
          status: "upcoming"
        })
        .select("id")
        .single();

      if (shiftError) throw shiftError;
      if (!shiftData?.id) throw new Error("Failed to create shift");

      // Save contract to shift_contract_templates
      const contractTitleToSave = formData.contractTitle || "Shift Contract";
      const contractBodyToSave = formData.contractBody || contractPreview;
      
      const { error: contractError } = await supabase
        .from("shift_contract_templates")
        .insert({
          shift_id: shiftData.id,
          company_id: user.id,
          title: contractTitleToSave,
          body_markdown: contractBodyToSave,
          version: 1,
          created_by: user.id
        });

      if (contractError) {
        console.error("Error saving contract template:", contractError);
        // Don't fail the whole operation if contract save fails, but log it
        toast.warning("Shift created but contract save failed", {
          description: "You can edit the contract later in Shift Details"
        });
      }

      // Create shift assignments for each promoter (if any assigned)
      if (formData.assignedPromoters.length > 0) {
        // Check for overlapping shifts before assigning
        // Format dates in local timezone to prevent timezone shifts
        const shiftDate = formData.dateRange.from ? formatDateLocal(formData.dateRange.from) : '';
        const shiftEndDate = formData.dateRange.to ? formatDateLocal(formData.dateRange.to) : null;
        const shiftStartTime = formData.startTime;
        const shiftEndTime = formData.endTime;

        const overlapChecks = await Promise.all(
          formData.assignedPromoters.map(async (promoter) => {
            const overlapping = await findOverlappingShifts(
              shiftData.id,
              promoter.id,
              shiftDate,
              shiftEndDate,
              shiftStartTime,
              shiftEndTime
            );
            return { promoterId: promoter.id, promoterName: promoter.fullName, overlapping };
          })
        );

        const promotersWithOverlaps = overlapChecks.filter(check => check.overlapping.length > 0);
        if (promotersWithOverlaps.length > 0) {
          const overlapNames = promotersWithOverlaps.map(p => p.promoterName).join(', ');
          toast.error(
            `Cannot assign ${promotersWithOverlaps.length} promoter(s) due to overlapping shifts`,
            {
              description: `${overlapNames} have conflicting shift assignments. Please unassign them from overlapping shifts first.`
            }
          );
          // Continue with non-overlapping promoters only
          const validPromoters = formData.assignedPromoters.filter(
            p => !promotersWithOverlaps.some(overlap => overlap.promoterId === p.id)
          );
          
          if (validPromoters.length === 0) {
            toast.error("No promoters could be assigned due to overlapping shifts");
            return { success: false };
          }

          toast.warning(`Assigned ${validPromoters.length} of ${formData.assignedPromoters.length} promoters (${promotersWithOverlaps.length} skipped due to overlaps)`);
          
          const assignmentPromises = validPromoters.map(promoter =>
            supabase
              .from("shift_assignments")
              .insert({
                shift_id: shiftData.id,
                promoter_id: promoter.id,
                status: "assigned"
              })
              .select("id")
              .single()
          );

          const assignmentResults = await Promise.all(assignmentPromises);
          
          // Create payment status records for each assignment
          const paymentDate = new Date(formData.paymentDate).toISOString();
          const paymentPromises = assignmentResults.map((result) => {
            if (result.error) return Promise.resolve(result.error);
            return (supabase as any)
              .from("shift_assignment_payment_status")
              .insert({
                assignment_id: result.data?.id,
                status: "scheduled",
                scheduled_at: paymentDate
              });
          });

          await Promise.all(paymentPromises);
          
          const promoterMessage = validPromoters.length > 0
            ? `Shift created and ${validPromoters.length} promoters assigned (${promotersWithOverlaps.length} skipped due to overlaps)`
            : "Shift created successfully. You can assign promoters later.";

          toast.success("Shift created successfully!", {
            description: promoterMessage
          });

          return { shiftId: shiftData.id, success: true };
        }

        // No overlaps, proceed with all assignments
        const assignmentPromises = formData.assignedPromoters.map(promoter =>
          supabase
            .from("shift_assignments")
            .insert({
              shift_id: shiftData.id,
              promoter_id: promoter.id,
              status: "assigned"
            })
            .select("id")
            .single()
        );

        const assignmentResults = await Promise.all(assignmentPromises);

        // Create payment status records for each assignment
        const paymentDate = new Date(formData.paymentDate).toISOString();
        const paymentPromises = assignmentResults.map((result) => {
          if (result.error) return Promise.resolve(result.error);
          // Use any type to bypass TypeScript limitations with newer tables
          return (supabase as any)
            .from("shift_assignment_payment_status")
            .insert({
              assignment_id: result.data?.id,
              status: "scheduled",
              scheduled_at: paymentDate
            });
        });

        await Promise.all(paymentPromises);
      }

      const promoterMessage = formData.assignedPromoters.length > 0
        ? `Shift created and ${formData.assignedPromoters.length} promoters assigned`
        : "Shift created successfully. You can assign promoters later.";

      toast.success("Shift created successfully!", {
        description: promoterMessage
      });

      return { shiftId: shiftData.id, success: true };
    } catch (error: any) {
      console.error("Error creating shift and contract:", error);
      const errorMessage = error?.message || error?.details || error?.hint || JSON.stringify(error) || "Unknown error";
      toast.error("Failed to create shift and contracts", {
        description: errorMessage
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [formData, user?.id, validateForm]);

  return {
    formData,
    paymentSchedule,
    contractPreview,
    loading,
    validationErrors,
    handleDetailsChange,
    handlePaymentChange,
    handlePromoterChange,
    handleContractChange,
    generateContractPreview,
    submitShiftAndContract
  };
}
