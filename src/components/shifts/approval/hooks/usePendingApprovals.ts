import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type PendingApproval = {
  shift_id: string;
  shift_title: string;
  shift_date: string;
  shift_end_date: string | null;
  assignment_id: string;
  promoter_id: string;
  promoter_name: string;
  promoter_code: string;
  total_hours: number;
  total_earnings: number;
  extra_payments: number;
  sessions_count: number;
  work_approved: boolean;
  work_approved_at: string | null;
};

export const usePendingApprovals = (companyId?: string) => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPendingPayment, setTotalPendingPayment] = useState(0);

  const fetchPendingApprovals = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get company_id if not provided
      let company_id = companyId;
      if (!company_id) {
        const { data: companyProfile } = await supabase
          .from("company_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (!companyProfile) {
          setPendingApprovals([]);
          setLoading(false);
          return;
        }
        company_id = companyProfile.user_id;
      }

      // Fetch completed shifts OR shifts that should be completed (end date passed)
      // We'll check both status = 'completed' and shifts where end_date has passed
      const today = new Date().toISOString().split('T')[0];
      
      // First get completed shifts
      const { data: completedShifts1, error: error1 } = await supabase
        .from("shifts")
        .select("id, title, date, end_date, status")
        .eq("company_id", company_id)
        .eq("status", "completed")
        .order("date", { ascending: false });
      
      // Then get shifts where end_date has passed (but not cancelled)
      const { data: completedShifts2, error: error2 } = await supabase
        .from("shifts")
        .select("id, title, date, end_date, status")
        .eq("company_id", company_id)
        .neq("status", "cancelled")
        .neq("status", "completed")
        .or(`end_date.lt.${today},and(end_date.is.null,date.lt.${today})`)
        .order("date", { ascending: false });
      
      const shiftsError = error1 || error2;
      const completedShifts = [
        ...(completedShifts1 || []),
        ...(completedShifts2 || [])
      ];
      
      // Remove duplicates
      const uniqueShifts = Array.from(
        new Map(completedShifts.map(s => [s.id, s])).values()
      );

      if (shiftsError) throw shiftsError;

      if (!uniqueShifts || uniqueShifts.length === 0) {
        setPendingApprovals([]);
        setTotalPendingPayment(0);
        setLoading(false);
        return;
      }

      const shiftIds = uniqueShifts.map(s => s.id);

      // Fetch assignments with unapproved work
      const { data: assignments, error: assignmentsError } = await supabase
        .from("shift_assignments")
        .select(`
          id,
          shift_id,
          promoter_id,
          work_approved,
          work_approved_at,
          profiles:promoter_id (
            full_name,
            unique_code
          )
        `)
        .in("shift_id", shiftIds)
        .eq("status", "accepted")
        .eq("work_approved", false);

      if (assignmentsError) throw assignmentsError;

      if (!assignments || assignments.length === 0) {
        setPendingApprovals([]);
        setTotalPendingPayment(0);
        setLoading(false);
        return;
      }

      // Fetch time logs for these assignments
      const promoterIds = [...new Set(assignments.map(a => a.promoter_id))];
      const { data: timeLogs, error: logsError } = await supabase
        .from("time_logs")
        .select("id, shift_id, user_id, total_hours, earnings")
        .in("shift_id", shiftIds)
        .in("user_id", promoterIds)
        .not("check_out_time", "is", null);

      if (logsError) throw logsError;

      // Fetch extra payments
      const assignmentIds = assignments.map(a => a.id);
      const { data: extraPayments, error: extrasError } = await (supabase as any)
        .from("extra_payments")
        .select("shift_assignment_id, shift_id, promoter_id, amount")
        .in("shift_assignment_id", assignmentIds);

      if (extrasError) {
        console.warn("Error fetching extra payments:", extrasError);
      }

      // Build approval data
      const approvals: PendingApproval[] = [];
      let totalPayment = 0;

      for (const assignment of assignments) {
        const shift = uniqueShifts.find(s => s.id === assignment.shift_id);
        if (!shift) continue;

        const logs = (timeLogs || []).filter(
          log => log.shift_id === assignment.shift_id && log.user_id === assignment.promoter_id
        );

        const extras = (extraPayments || []).filter(
          ep => ep.shift_assignment_id === assignment.id
        );

        const totalHours = logs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
        const baseEarnings = logs.reduce((sum, log) => sum + (log.earnings || 0), 0);
        const extraEarnings = extras.reduce((sum, ep) => sum + (ep.amount || 0), 0);
        const totalEarnings = baseEarnings + extraEarnings;

        totalPayment += totalEarnings;

        approvals.push({
          shift_id: assignment.shift_id,
          shift_title: shift.title,
          shift_date: shift.date,
          shift_end_date: shift.end_date,
          assignment_id: assignment.id,
          promoter_id: assignment.promoter_id,
          promoter_name: (assignment.profiles as any)?.full_name || "Unknown",
          promoter_code: (assignment.profiles as any)?.unique_code || "N/A",
          total_hours,
          total_earnings: totalEarnings,
          extra_payments: extraEarnings,
          sessions_count: logs.length,
          work_approved: assignment.work_approved || false,
          work_approved_at: assignment.work_approved_at,
        });
      }

      setPendingApprovals(approvals);
      setTotalPendingPayment(totalPayment);
    } catch (error: any) {
      console.error("Error fetching pending approvals:", error);
      setPendingApprovals([]);
      setTotalPendingPayment(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, companyId]);

  useEffect(() => {
    fetchPendingApprovals();
    
    // Real-time subscription for updates
    if (!user?.id) return;
    
    const channel = supabase
      .channel(`pending_approvals_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_assignments",
          filter: `work_approved=eq.false`,
        },
        () => {
          fetchPendingApprovals();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shifts",
          filter: `status=eq.completed`,
        },
        () => {
          fetchPendingApprovals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingApprovals, user?.id]);

  return {
    pendingApprovals,
    totalPendingPayment,
    loading,
    refetch: fetchPendingApprovals,
  };
};

