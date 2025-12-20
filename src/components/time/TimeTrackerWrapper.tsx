
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
  }> => {
    if (!user?.id || !shift?.id) {
      return {
        companyId: null,
        companyName: null,
        templateId: null,
        templateTitle: "Company Contract",
        templateBody: "",
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

    if (cId) {
      // Try to resolve company display name (optional)
      const { data: companyProfile } = await supabase
        .from("company_profiles")
        .select("name")
        .eq("user_id", cId)
        .maybeSingle();
      const cName = companyProfile?.name ?? null;

      // Load active contract template for company
      const { data: tpl, error: tplErr } = await (supabase as any)
        .from("company_contract_templates")
        .select("id, title, body_markdown")
        .eq("company_id", cId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (tplErr) throw tplErr;
      if (!tpl?.id) {
        return {
          companyId: cId,
          companyName: cName,
          templateId: null,
          templateTitle: "Company Contract",
          templateBody: "",
        };
      }
      return {
        companyId: cId,
        companyName: cName,
        templateId: tpl.id,
        templateTitle: tpl.title || "Company Contract",
        templateBody: tpl.body_markdown || "",
      };
    }

    return {
      companyId: null,
      companyName: null,
      templateId: null,
      templateTitle: "Company Contract",
      templateBody: "",
    };
  };

  const hasAcceptance = async (cId: string) => {
    if (!user?.id) return false;
    const { data, error } = await (supabase as any)
      .from("company_contract_acceptances")
      .select("id")
      .eq("company_id", cId)
      .eq("promoter_id", user.id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.id);
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

      if (!loaded.companyId) {
        // No company_id – allow tracking (legacy)
        setContractLoading(false);
        return handleStartTracking();
      }

      // If acceptance exists, proceed
      const accepted = await hasAcceptance(loaded.companyId);
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
      const { error } = await (supabase as any)
        .from("company_contract_acceptances")
        .insert({
          company_id: companyId,
          promoter_id: user.id,
          template_id: templateId,
          signature_text: signatureText,
          accept_user_agent: navigator.userAgent,
          accepted_at: new Date().toISOString(),
        });
      if (error) throw error;

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
