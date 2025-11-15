import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { calculateLiveEarnings } from "@/components/shifts/utils/paymentCalculations";

export interface ActivePromoter {
  id: string;
  name: string;
  checkInTime: string;
  elapsedHours: number;
  currentEarnings: number;
}

export interface ShiftWithLiveData extends Shift {
  totalAssigned: number;
  activePromoters: ActivePromoter[];
  liveEarnings: number;
}

export const useCompanyLiveData = (companyId: string | undefined) => {
  const [ongoingShifts, setOngoingShifts] = useState<ShiftWithLiveData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalActivePromoters, setTotalActivePromoters] = useState(0);
  const [totalLiveEarnings, setTotalLiveEarnings] = useState(0);

  const fetchLiveData = async () => {
    if (!companyId) return;

    try {
      // Fetch ongoing shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from("shifts")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "ongoing")
        .order("date", { ascending: true });

      if (shiftsError) throw shiftsError;
      if (!shifts || shifts.length === 0) {
        setOngoingShifts([]);
        setTotalActivePromoters(0);
        setTotalLiveEarnings(0);
        setLoading(false);
        return;
      }

      const shiftIds = shifts.map((s) => s.id);

      // Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("shift_assignments")
        .select(`
          *,
          profiles:promoter_id (
            id,
            full_name
          )
        `)
        .in("shift_id", shiftIds);

      if (assignmentsError) throw assignmentsError;

      // Fetch active time logs (checked in but not out)
      const { data: activeLogs, error: logsError } = await supabase
        .from("time_logs")
        .select("*")
        .in("shift_id", shiftIds)
        .is("check_out_time", null);

      if (logsError) throw logsError;

      // Build shifts with live data
      const shiftsWithData: ShiftWithLiveData[] = shifts.map((shift) => {
        const shiftAssignments = assignments?.filter((a) => a.shift_id === shift.id) || [];
        const shiftLogs = activeLogs?.filter((log) => log.shift_id === shift.id) || [];

        const activePromoters: ActivePromoter[] = shiftLogs.map((log) => {
          const assignment = shiftAssignments.find((a) => a.promoter_id === log.user_id);
          const profile = assignment?.profiles as any;
          
          const { elapsedHours, currentEarnings } = calculateLiveEarnings(
            log.check_in_time,
            shift.pay_rate,
            shift.pay_rate_type || "hourly"
          );

          return {
            id: log.user_id,
            name: profile?.full_name || "Unknown",
            checkInTime: log.check_in_time,
            elapsedHours,
            currentEarnings,
          };
        });

        const liveEarnings = activePromoters.reduce((sum, p) => sum + p.currentEarnings, 0);

        return {
          id: shift.id,
          title: shift.title,
          description: shift.description || undefined,
          date: shift.date,
          startTime: shift.start_time,
          endTime: shift.end_time,
          endDate: shift.end_date || undefined,
          location: shift.location || "",
          status: shift.status as any,
          payRate: shift.pay_rate,
          payRateType: shift.pay_rate_type || "hourly",
          isPaid: shift.is_paid || false,
          latitude: shift.latitude || undefined,
          longitude: shift.longitude || undefined,
          promoterId: shift.promoter_id || undefined,
          companyId: shift.company_id || undefined,
          createdAt: shift.created_at || undefined,
          updatedAt: shift.updated_at || undefined,
          created_at: shift.created_at || undefined,
          manual_status_override: shift.manual_status_override || false,
          override_status: shift.override_status || undefined,
          totalAssigned: shiftAssignments.length,
          activePromoters,
          liveEarnings,
        };
      });

      setOngoingShifts(shiftsWithData);
      setTotalActivePromoters(shiftsWithData.reduce((sum, s) => sum + s.activePromoters.length, 0));
      setTotalLiveEarnings(shiftsWithData.reduce((sum, s) => sum + s.liveEarnings, 0));
    } catch (error) {
      console.error("Error fetching live data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update live earnings every second
  useEffect(() => {
    if (ongoingShifts.length === 0) return;

    const interval = setInterval(() => {
      setOngoingShifts((prevShifts) =>
        prevShifts.map((shift) => {
          const updatedPromoters = shift.activePromoters.map((promoter) => {
            const { elapsedHours, currentEarnings } = calculateLiveEarnings(
              promoter.checkInTime,
              shift.payRate,
              shift.payRateType || "hourly"
            );
            return { ...promoter, elapsedHours, currentEarnings };
          });

          const liveEarnings = updatedPromoters.reduce((sum, p) => sum + p.currentEarnings, 0);

          return { ...shift, activePromoters: updatedPromoters, liveEarnings };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [ongoingShifts.length]);

  // Update totals when shifts change
  useEffect(() => {
    setTotalActivePromoters(ongoingShifts.reduce((sum, s) => sum + s.activePromoters.length, 0));
    setTotalLiveEarnings(ongoingShifts.reduce((sum, s) => sum + s.liveEarnings, 0));
  }, [ongoingShifts]);

  // Initial fetch
  useEffect(() => {
    fetchLiveData();
  }, [companyId]);

  // Real-time subscriptions
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel("company-live-data")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shifts",
          filter: `company_id=eq.${companyId}`,
        },
        () => fetchLiveData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_logs",
        },
        () => fetchLiveData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shift_assignments",
        },
        () => fetchLiveData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return { ongoingShifts, totalActivePromoters, totalLiveEarnings, loading };
};
