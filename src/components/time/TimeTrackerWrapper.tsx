
import { forwardRef, useImperativeHandle, useEffect, useMemo, useState } from "react";
import { Shift } from "../shifts/types/ShiftTypes";
import { useTimeTracking } from "./hooks/useTimeTracking";
import TimeTrackerCard from "./components/TimeTrackerCard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ContractAcceptanceDialog from "@/components/contracts/ContractAcceptanceDialog";
import { isMissingTableError } from "@/utils/supabaseErrors";

type TimeTrackerProps = {
  shift?: Shift;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  autoStart?: boolean;
  autoStop?: boolean;
};

const TimeTrackerWrapper = forwardRef(({ 
  shift, 
  onCheckIn, 
  onCheckOut,
  autoStart,
  autoStop
}: TimeTrackerProps, ref) => {
  const { user } = useAuth();
  const [contractOpen, setContractOpen] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [contractTitle, setContractTitle] = useState<string>("Company Contract");
  const [contractBody, setContractBody] = useState<string>("");
  const [shiftAssignmentId, setShiftAssignmentId] = useState<string | null>(null);

  const {
    isTracking,
    elapsedTime,
    earnings,
    startTime,
    loading,
    locationVerified,
    showLocationError,
    isNotActiveShift,
    handleStartTracking,
    handleStopTracking,
    setShowLocationError,
    logTimeEntry,
    timeLogId,
    handleLocationError
  } = useTimeTracking(shift, onCheckIn, onCheckOut);

  const canGate = useMemo(() => Boolean(user?.id && shift?.id && !isTracking), [user?.id, shift?.id, isTracking]);

  const loadCompanyAndContract = async (): Promise<{
    companyId: string | null;
    companyName: string | null;
    templateId: string | null;
    templateTitle: string;
    templateBody: string;
    shiftAssignmentId: string | null;
  }> => {
    if (!user?.id || !shift?.id) {
      return {
        companyId: null,
        companyName: null,
        templateId: null,
        templateTitle: "Company Contract",
        templateBody: "",
        shiftAssignmentId: null,
      };
    }
    // Fetch company_id for this shift (Shift type doesn't always include it)
    const { data: shiftRow, error: shiftErr } = await supabase
      .from("shifts")
      .select("id, company_id, title, date, start_time, end_time, location, pay_rate, pay_rate_type")
      .eq("id", shift.id)
      .maybeSingle();
    if (shiftErr) throw shiftErr;
    const cId = (shiftRow?.company_id as string | null) ?? null;

    // Get shift assignment ID for this promoter and shift
    let shiftAssignmentId: string | null = null;
    if (user.id && shift.id) {
      const { data: assignment } = await supabase
        .from("shift_assignments")
        .select("id")
        .eq("shift_id", shift.id)
        .eq("promoter_id", user.id)
        .maybeSingle();
      shiftAssignmentId = assignment?.id ?? null;
    }

    if (cId) {
      // Try to resolve company display name (optional)
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("name")
        .eq("user_id", cId)
        .maybeSingle();
      const cName = companyProfile?.name ?? null;

      // Check for shift-specific contract template (required)
      const { data: shiftTpl, error: shiftTplErr } = await supabase
        .from("shift_contract_templates")
        .select("id, title, body_markdown")
        .eq("shift_id", shift.id)
        .maybeSingle();
      
      if (shiftTpl && !shiftTplErr) {
        // Use shift-specific contract
        return {
          companyId: cId,
          companyName: cName,
          templateId: shiftTpl.id, // Use shift template ID
          templateTitle: shiftTpl.title || "Shift Contract",
          templateBody: shiftTpl.body_markdown || "",
          shiftAssignmentId,
        };
      }

      // No shift-specific contract found - return empty (contract should be created during shift creation)
      return {
        companyId: cId,
        companyName: cName,
        templateId: null,
        templateTitle: "Shift Contract",
        templateBody: "",
        shiftAssignmentId,
      };
    }

    return {
      companyId: null,
      companyName: null,
      templateId: null,
      templateTitle: "Company Contract",
      templateBody: "",
      shiftAssignmentId,
    };
  };

  const hasAcceptance = async (cId: string, shiftAssignmentId?: string) => {
    if (!user?.id) return false;
    
    // If we have a shift assignment ID, check for per-shift approval
    if (shiftAssignmentId) {
      const { data, error } = await (supabase as any)
        .from("company_contract_acceptances")
        .select("id, status, superseded_at")
        .eq("shift_assignment_id", shiftAssignmentId)
        .eq("promoter_id", user.id)
        .is("superseded_at", null) // Only check non-superseded acceptances
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      // Check if there's a pending contract (new version requiring approval)
      if (data?.status === 'pending') {
        return false; // Block check-in if pending
      }
      return data?.status === 'accepted';
    }
    
    // Fallback to company-level check (for backward compatibility)
    const { data, error } = await (supabase as any)
      .from("company_contract_acceptances")
      .select("id, status, superseded_at")
      .eq("company_id", cId)
      .eq("promoter_id", user.id)
      .is("superseded_at", null) // Only check non-superseded acceptances
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    // Check if there's a pending contract (new version requiring approval)
    if (data?.status === 'pending') {
      return false; // Block check-in if pending
    }
    return data?.status === 'accepted';
  };

  const gatedStartTracking = async () => {
    if (!shift) return;
    if (!canGate) return handleStartTracking();

    try {
      setContractLoading(true);
      const loaded = await loadCompanyAndContract();
      setCompanyId(loaded.companyId);
      setCompanyName(loaded.companyName);
      setTemplateId(loaded.templateId);
      setContractTitle(loaded.templateTitle);
      setContractBody(loaded.templateBody);
      setShiftAssignmentId(loaded.shiftAssignmentId);

      if (!loaded.companyId) {
        // No company_id – allow tracking (legacy)
        setContractLoading(false);
        return handleStartTracking();
      }

      // If acceptance exists for this shift assignment, proceed
      const accepted = await hasAcceptance(loaded.companyId, loaded.shiftAssignmentId || undefined);
      if (accepted) {
        setContractLoading(false);
        return handleStartTracking();
      }

      // Need acceptance; ensure template exists
      if (!loaded.templateId) {
        setContractLoading(false);
        toast.error("Contract not available", { description: "Company has not published a contract template yet." });
        return;
      }

      setContractLoading(false);
      setContractOpen(true);
    } catch (e: any) {
      console.error(e);
      setContractLoading(false);
      // Don't block shift start if the contract tables aren't deployed yet
      if (!isMissingTableError(e, "company_contract_templates") && !isMissingTableError(e, "company_contract_acceptances")) {
        toast.error("Contract check failed", { description: "Proceeding without contract check." });
      }
      return handleStartTracking();
    }
  };

  const acceptAndStart = async (signatureText: string) => {
    if (!user?.id || !companyId || !templateId) return;
    setContractLoading(true);
    try {
      // If we have a shift assignment ID, update the existing pending record
      if (shiftAssignmentId) {
        const { error } = await (supabase as any)
          .from("company_contract_acceptances")
          .update({
            signature_text: signatureText,
            accept_user_agent: navigator.userAgent,
            accept_ip: null, // Could get IP from request if needed
            accepted_at: new Date().toISOString(),
            status: 'accepted',
          })
          .eq("shift_assignment_id", shiftAssignmentId)
          .eq("promoter_id", user.id);
        if (error) throw error;
      } else {
        // Fallback: create new acceptance (shouldn't happen with new system, but for backward compatibility)
        const { error } = await (supabase as any)
          .from("company_contract_acceptances")
          .insert({
            company_id: companyId,
            promoter_id: user.id,
            template_id: templateId,
            shift_id: shift?.id || null,
            shift_assignment_id: shiftAssignmentId,
            signature_text: signatureText,
            accept_user_agent: navigator.userAgent,
            accepted_at: new Date().toISOString(),
            status: 'accepted',
          });
        if (error) throw error;
      }

      toast.success("Contract accepted");
      setContractOpen(false);
      await handleStartTracking();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to accept contract");
    } finally {
      setContractLoading(false);
    }
  };
  
  // Expose the handleStartTracking method to parent components
  useImperativeHandle(ref, () => ({
    handleStartTracking,
    handleStopTracking
  }));
  
  // Auto-start tracking when the autoStart prop is true
  useEffect(() => {
    if (autoStart && shift && !isTracking && !isNotActiveShift) {
      void gatedStartTracking();
    }
  }, [autoStart, shift, isTracking, isNotActiveShift]);
  
  // Auto-stop tracking when the autoStop prop is true
  useEffect(() => {
    if (autoStop && isTracking && shift) {
      handleStopTracking();
      
      // Log the time entry when stopping automatically
      if (shift && timeLogId) {
        logTimeEntry(shift.id, timeLogId, isTracking, startTime, elapsedTime);
      }
    }
  }, [autoStop, isTracking, handleStopTracking, logTimeEntry, shift, timeLogId, startTime, elapsedTime]);
  
  // Don't render the component if there's nothing to show and it's not supposed to autoStart
  if (!isTracking && !shift) {
    return null;
  }
  
  return (
    <>
      <TimeTrackerCard
        isTracking={isTracking}
        startTime={startTime}
        elapsedTime={elapsedTime}
        earnings={earnings}
        locationVerified={locationVerified}
        showLocationError={showLocationError}
        loading={loading || contractLoading}
        isNotActiveShift={isNotActiveShift}
        handleStartTracking={gatedStartTracking}
        handleStopTracking={handleStopTracking}
        handleDismissError={handleLocationError}
        autoStart={autoStart}
        autoStop={autoStop}
      />

      {shift && (
        <ContractAcceptanceDialog
          open={contractOpen}
          onOpenChange={setContractOpen}
          companyName={companyName}
          shift={shift}
          contractTitle={contractTitle}
          contractBody={contractBody}
          loading={contractLoading}
          onAccept={acceptAndStart}
        />
      )}
    </>
  );
});

TimeTrackerWrapper.displayName = "TimeTrackerWrapper";

export default TimeTrackerWrapper;
