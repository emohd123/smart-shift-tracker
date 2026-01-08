
import { useState, useEffect, useCallback } from "react";
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";
import {
  formatDatabaseShifts,
  filterShiftsByRole,
  synchronizeShifts,
  clearShiftsFromLocalStorage
} from "./utils/shiftDataUtils";
import { isAdminLike } from "@/utils/roleUtils";

interface UseShiftsFetchProps {
  userId?: string;
  userRole?: string;
  isAuthenticated?: boolean;
}

// Helper function to enhance shifts with related data
const enhanceShiftsWithDetails = async (shifts: any[], assignmentMap?: Map<string, any>) => {
  if (!shifts || shifts.length === 0) return shifts;

  const shiftIds = shifts.map(s => s.id);
  const companyIds = [...new Set(shifts.map(s => s.company_id).filter(Boolean))];

  // Fetch company profiles
  let companyMap = new Map<string, { name: string; logo_url: string | null }>();
  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from('company_profiles')
      .select('user_id, name, logo_url')
      .in('user_id', companyIds);

    companies?.forEach(c => {
      companyMap.set(c.user_id, {
        name: c.name,
        logo_url: c.logo_url
      });
    });
  }

  // Count assignments per shift
  const { data: assignments } = await supabase
    .from('shift_assignments')
    .select('shift_id, status')
    .in('shift_id', shiftIds)
    .in('status', ['accepted', 'pending']);

  const assignmentCountMap = new Map<string, number>();
  assignments?.forEach(a => {
    assignmentCountMap.set(a.shift_id, (assignmentCountMap.get(a.shift_id) || 0) + 1);
  });

  // Count active assignments (checked in)
  const { data: activeLogs } = await supabase
    .from('time_logs')
    .select('shift_id')
    .in('shift_id', shiftIds)
    .is('check_out_time', null);

  const activeCountMap = new Map<string, number>();
  activeLogs?.forEach(log => {
    activeCountMap.set(log.shift_id, (activeCountMap.get(log.shift_id) || 0) + 1);
  });

  // Aggregate time logs for completed shifts
  const { data: timeLogs } = await supabase
    .from('time_logs')
    .select('shift_id, total_hours, earnings')
    .in('shift_id', shiftIds)
    .not('check_out_time', 'is', null);

  const hoursMap = new Map<string, number>();
  const earningsMap = new Map<string, number>();
  timeLogs?.forEach(log => {
    if (log.shift_id) {
      hoursMap.set(log.shift_id, (hoursMap.get(log.shift_id) || 0) + (log.total_hours || 0));
      earningsMap.set(log.shift_id, (earningsMap.get(log.shift_id) || 0) + (log.earnings || 0));
    }
  });

  // Check work approval status (for completed shifts)
  const { data: approvedAssignments } = await supabase
    .from('shift_assignments')
    .select('shift_id, work_approved, work_approved_at')
    .in('shift_id', shiftIds)
    .eq('work_approved', true);

  const approvalMap = new Map<string, { approved: boolean; approvedAt: string | null }>();
  approvedAssignments?.forEach(a => {
    if (!approvalMap.has(a.shift_id)) {
      approvalMap.set(a.shift_id, {
        approved: true,
        approvedAt: a.work_approved_at || null
      });
    }
  });

  // Enhance each shift with the fetched data
  return shifts.map(shift => {
    const company = companyMap.get(shift.company_id);
    const assignment = assignmentMap?.get(shift.id);
    
    return {
      ...shift,
      companyName: company?.name,
      companyLogoUrl: company?.logo_url || null,
      promoterCount: assignmentCountMap.get(shift.id) || 0,
      activePromoterCount: activeCountMap.get(shift.id) || 0,
      totalHours: hoursMap.get(shift.id) || 0,
      totalEarnings: earningsMap.get(shift.id) || 0,
      workApproved: assignment?.work_approved || approvalMap.get(shift.id)?.approved || false,
      workApprovedAt: assignment?.work_approved_at || approvalMap.get(shift.id)?.approvedAt || null
    };
  });
};

export const useShiftsFetch = ({ userId, userRole, isAuthenticated }: UseShiftsFetchProps) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create a refreshShifts function that can be called on demand
  const refreshShifts = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);

    try {
      // Clear local storage cache to ensure fresh data
      clearShiftsFromLocalStorage();

      // For promoters, fetch shifts they're assigned to via shift_assignments
      if (userRole === 'promoter' && userId) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('shift_assignments')
          .select('shift_id, work_approved, work_approved_at')
          .eq('promoter_id', userId)
          .in('status', ['accepted', 'pending']);

        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
          throw assignmentsError;
        }

        if (!assignments || assignments.length === 0) {
          setShifts([]);
          setLoading(false);
          return;
        }

        const shiftIds = assignments.map(a => a.shift_id);
        const assignmentMap = new Map(assignments.map(a => [a.shift_id, a]));

        // Fetch shifts for these IDs
        const { data: dbShifts, error: dbError } = await supabase
          .from('shifts')
          .select('*')
          .in('id', shiftIds)
          .order('created_at', { ascending: false });

        if (dbError) {
          console.error('Database error fetching shifts:', dbError);
          throw dbError;
        }

        if (dbShifts && dbShifts.length > 0) {
          // Fetch additional data for these shifts
          const enhancedShifts = await enhanceShiftsWithDetails(dbShifts, assignmentMap);
          const formattedShifts = formatDatabaseShifts(enhancedShifts);
          setShifts(formattedShifts);
        } else {
          setShifts([]);
        }
      } else {
        // For admins and companies, fetch all shifts (filtered by company_id for companies)
        console.log('Fetching shifts for role:', userRole, 'userId:', userId);
        
        let query = supabase
          .from('shifts')
          .select('*');

        // Only filter by company_id if user is a company (not admin)
        if (userRole === 'company' && userId) {
          console.log('Filtering shifts by company_id:', userId);
          query = query.eq('company_id', userId);
        } else if (isAdminLike(userRole)) {
          console.log('Admin user - fetching ALL shifts without company filter');
          // For admins, explicitly don't filter - fetch everything
          // This ensures RLS policies allow admin access
        }

        // Execute the query
        const { data: dbShifts, error: dbError } = await query
          .order('created_at', { ascending: false });

        if (dbError) {
          console.error('Database error fetching shifts:', dbError);
          console.error('Error details:', {
            message: dbError.message,
            details: dbError.details,
            hint: dbError.hint,
            code: dbError.code
          });
          throw dbError;
        }

        console.log('Fetched shifts from database:', dbShifts?.length || 0, 'shifts');

        if (dbShifts && dbShifts.length > 0) {
          console.log('Enhancing shifts with details...');
          const enhancedShifts = await enhanceShiftsWithDetails(dbShifts);
          const formattedShifts = formatDatabaseShifts(enhancedShifts);
          console.log('Formatted shifts:', formattedShifts.length);
          setShifts(formattedShifts);
        } else {
          console.log('No shifts found in database');
          setShifts([]);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));

      // Last resort: fall back to an empty array
      setShifts([]);

      // Show error toast
      toast.error("Failed to load shifts", {
        description: "Please try refreshing the page."
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, userId, userRole]);

  // Load shifts based on user role
  useEffect(() => {
    refreshShifts();
  }, [refreshShifts]);

  // Set up realtime listeners for shifts, assignments, and time_logs changes
  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscribe to real-time changes in the shifts table
    const shiftsChannel = supabase
      .channel('shifts-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        (payload) => {
          refreshShifts();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shift_assignments' },
        (payload) => {
          refreshShifts();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'time_logs' },
        (payload) => {
          refreshShifts();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(shiftsChannel);
    };
  }, [isAuthenticated, refreshShifts]);

  return {
    shifts,
    loading,
    error,
    setShifts,
    refreshShifts
  };
};
