
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shift } from "../shifts/types/ShiftTypes";
import DashboardStats from "./components/DashboardStats";
import NextShiftCard from "./components/NextShiftCard";
import UpcomingShiftsList from "./components/UpcomingShiftsList";
import { useState, useEffect, useCallback } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "../ui/button";
import { Award, Copy, Check, CheckCircle, Clock, Star, AlertCircle, RefreshCw, Play, Timer, DollarSign, History, Calendar } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { formatBHD, calculateLiveEarnings } from "../shifts/utils/paymentCalculations";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getEffectiveStatus, calculateShiftStatus } from "../shifts/utils/statusCalculations";
import { Badge } from "../ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PromoterRatingBadge } from "@/components/ratings/PromoterRatingBadge";
import { ApproveShiftDialog } from "../shifts/pendingApproval/ApproveShiftDialog";
import { Skeleton } from "../ui/skeleton";
import { format as formatDate } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Eye } from "lucide-react";

type PromoterDashboardProps = {
  shifts?: Shift[]; // Optional - we fetch our own data now
  loading?: boolean;
};

export default function PromoterDashboard({ loading: externalLoading = false }: PromoterDashboardProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const { format: formatCurrency } = useCurrency();
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Main data states
  const [assignedShifts, setAssignedShifts] = useState<Shift[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [approvedShiftsCount, setApprovedShiftsCount] = useState(0);
  const [approvedShiftIds, setApprovedShiftIds] = useState<Set<string>>(new Set());
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [pendingContracts, setPendingContracts] = useState<any[]>([]);
  const [recentTimeLogs, setRecentTimeLogs] = useState<any[]>([]);
  const [actualEarnings, setActualEarnings] = useState<{ total: number; unpaid: number }>({ total: 0, unpaid: 0 });
  const [shiftEarnings, setShiftEarnings] = useState<Map<string, number>>(new Map());
  const [extraPaymentsTotal, setExtraPaymentsTotal] = useState(0);
  const [shiftApprovalStatus, setShiftApprovalStatus] = useState<Map<string, {
    work_approved: boolean;
    work_approved_at: string | null;
  }>>(new Map());
  
  // Shift history modal state
  const [selectedHistoryShift, setSelectedHistoryShift] = useState<Shift | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedShiftTimeLogs, setSelectedShiftTimeLogs] = useState<any[]>([]);
  const [selectedShiftExtras, setSelectedShiftExtras] = useState<any[]>([]);
  
  // Active session state for live earnings
  const [activeSession, setActiveSession] = useState<{
    id: string;
    shift_id: string;
    check_in_time: string;
    shift_title: string;
    pay_rate: number;
    pay_rate_type: string;
  } | null>(null);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const [liveEarnings, setLiveEarnings] = useState(0);

  // Calculate dashboard data from assigned shifts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Helper to get real-time status (not stored status)
  const getRealTimeStatus = (shift: Shift) => {
    // First check manual override
    if (shift.manual_status_override && shift.override_status) {
      return shift.override_status;
    }
    // Calculate status dynamically based on current time
    return calculateShiftStatus(shift);
  };
  
  // Find current/ongoing shift - check if promoter is actively working (has active session)
  // OR the shift is within its scheduled time
  let currentShift: Shift | null = activeSession 
    ? assignedShifts.find(shift => shift.id === activeSession.shift_id) || null
    : assignedShifts.find(shift => getRealTimeStatus(shift) === "ongoing") || null;
  
  // If we have an active session but no matching shift in assignedShifts, create a fallback
  if (activeSession && !currentShift) {
    currentShift = {
      id: activeSession.shift_id,
      title: activeSession.shift_title,
      date: new Date().toISOString().split('T')[0],
      startTime: formatDate(new Date(activeSession.check_in_time), 'HH:mm'),
      endTime: '--:--',
      location: '',
      status: 'ongoing',
      payRate: activeSession.pay_rate,
      payRateType: activeSession.pay_rate_type,
      is_assigned: true,
    };
  }
  
  // Filter upcoming shifts - include shifts where today is within the date range
  const upcomingShifts = assignedShifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    shiftDate.setHours(0, 0, 0, 0);
    const endDate = shift.endDate ? new Date(shift.endDate) : new Date(shift.date);
    endDate.setHours(23, 59, 59, 999);
    const realStatus = getRealTimeStatus(shift);
    
    // Include if: today is within shift date range AND not completed/cancelled
    const isWithinDateRange = today <= endDate;
    return isWithinDateRange && realStatus !== "completed" && realStatus !== "cancelled";
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Use current shift if exists, otherwise first upcoming shift
  const nextShift = currentShift || upcomingShifts[0] || null;
  const isCurrentShift = !!currentShift || !!activeSession;
  
  const completedShifts = assignedShifts.filter(shift => getRealTimeStatus(shift) === "completed").length;
  
  const completedShiftsList = assignedShifts.filter(shift => getRealTimeStatus(shift) === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch assigned shifts directly from shift_assignments with joined shift data
  const fetchAssignedShifts = useCallback(async () => {
    if (!user?.id) return;
    
    setShiftsLoading(true);
    try {
      // Fetch all assignments (both accepted and pending) with shift details
      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
          id,
          status,
          shift_id,
          work_approved,
          work_approved_at,
          shifts!inner (
            id,
            title,
            date,
            end_date,
            start_time,
            end_time,
            location,
            status,
            pay_rate,
            pay_rate_type,
            is_paid,
            company_id,
            created_at,
            manual_status_override,
            override_status
          )
        `)
        .eq('promoter_id', user.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assigned shifts:', error);
        setAssignedShifts([]);
        return;
      }

      // Format shifts to match our Shift type
      const formattedShifts: Shift[] = (data || []).map((assignment: any) => ({
        id: assignment.shifts.id,
        title: assignment.shifts.title,
        date: assignment.shifts.date,
        endDate: assignment.shifts.end_date,
        startTime: assignment.shifts.start_time,
        endTime: assignment.shifts.end_time,
        location: assignment.shifts.location,
        status: assignment.shifts.status,
        payRate: assignment.shifts.pay_rate || 0,
        payRateType: assignment.shifts.pay_rate_type || 'hour',
        isPaid: assignment.shifts.is_paid || false,
        companyId: assignment.shifts.company_id,
        created_at: assignment.shifts.created_at,
        manual_status_override: assignment.shifts.manual_status_override || false,
        override_status: assignment.shifts.override_status || undefined,
        is_assigned: true,
        assigned_promoters: 1
      }));

      // Build approval status map
      const approvalMap = new Map<string, { work_approved: boolean; work_approved_at: string | null }>();
      (data || []).forEach((assignment: any) => {
        approvalMap.set(assignment.shifts.id, {
          work_approved: assignment.work_approved || false,
          work_approved_at: assignment.work_approved_at || null,
        });
      });
      setShiftApprovalStatus(approvalMap);

      console.log('Fetched assigned shifts:', formattedShifts.length);
      setAssignedShifts(formattedShifts);
    } catch (error) {
      console.error('Error fetching assigned shifts:', error);
      setAssignedShifts([]);
    } finally {
      setShiftsLoading(false);
    }
  }, [user?.id]);

  // Fetch pending shift assignments (shifts assigned to promoter but not yet accepted)
  const fetchPendingAssignments = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      // Fetch assignments with shift details and company info
      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
          id,
          status,
          shift_id,
          shifts (
            id,
            title,
            date,
            start_time,
            end_time,
            location,
            pay_rate,
            pay_rate_type,
            company_id
          )
        `)
        .eq('promoter_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending assignments:', error);
        setPendingAssignments([]);
        return;
      }
      
      // Now fetch company details for each shift
      if (data && data.length > 0) {
        const companyIds = [...new Set(data.map(a => a.shifts?.company_id).filter(Boolean))];
        
        // Fetch from profiles table
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', companyIds);
        
        // Fetch from company_profiles table (this has the actual company name)
        const { data: companyProfiles } = await supabase
          .from('company_profiles')
          .select('user_id, name')
          .in('user_id', companyIds);
        
        // Create company map - prioritize company_profiles.name
        const companyMap = new Map();
        profiles?.forEach((p: any) => {
          companyMap.set(p.id, { full_name: p.full_name });
        });
        companyProfiles?.forEach((cp: any) => {
          const existing = companyMap.get(cp.user_id) || {};
          companyMap.set(cp.user_id, { 
            ...existing, 
            company_name: cp.name,
            full_name: cp.name || existing.full_name
          });
        });
        
        // Merge company data into assignments
        const enrichedData = data.map(assignment => ({
          ...assignment,
          shifts: {
            ...assignment.shifts,
            company: companyMap.get(assignment.shifts?.company_id) || {},
            company_name: companyMap.get(assignment.shifts?.company_id)?.company_name || 
                         companyMap.get(assignment.shifts?.company_id)?.full_name || 
                         'Unknown Company'
          }
        }));
        setPendingAssignments(enrichedData);
        return;
      }
      
      setPendingAssignments(data || []);
    } catch (error) {
      console.error('Error fetching pending assignments:', error);
      toast.error('Failed to load pending shifts');
    }
  }, [user?.id]);

  // Fetch pending contracts that need approval
  const fetchPendingContracts = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      const { data, error } = await (supabase as any)
        .from('company_contract_acceptances')
        .select(`
          id,
          company_id,
          shift_id,
          shift_assignment_id,
          template_id,
          status,
          created_at,
          shifts:shift_id (
            id,
            title,
            date,
            end_date,
            start_time,
            end_time,
            location,
            company_id,
            pay_rate,
            pay_rate_type
          )
        `)
        .eq('promoter_id', user.id)
        .eq('status', 'pending')
        .is('superseded_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching pending contracts:', error);
        return;
      }
      
      // Fetch company names and templates for each contract
      if (data && data.length > 0) {
        const companyIds = [...new Set(data.map((c: any) => c.company_id).filter(Boolean))];
        
        const companyMap = new Map();
        
        const { data: companyProfiles } = await supabase
          .from('company_profiles')
          .select('user_id, name')
          .in('user_id', companyIds);
        
        if (companyProfiles) {
          companyProfiles.forEach((cp: any) => {
            companyMap.set(cp.user_id, {
              company_name: cp.name,
              full_name: cp.name
            });
          });
        }
        
        // Fallback for missing companies
        const fetchedCompanyIds = Array.from(companyMap.keys());
        const missingCompanyIds = companyIds.filter(id => !fetchedCompanyIds.includes(id));
        
        if (missingCompanyIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', missingCompanyIds);
          
          profiles?.forEach((p: any) => {
            if (!companyMap.has(p.id)) {
              companyMap.set(p.id, { full_name: p.full_name });
            }
          });
        }
        
        // Fetch shift-specific contract templates
        const templateMap = new Map();
        const shiftIds = [...new Set(data.map((c: any) => c.shift_id).filter(Boolean))];
        
        if (shiftIds.length > 0) {
          try {
            const { data: shiftTemplates } = await supabase
              .from('shift_contract_templates')
              .select('id, shift_id, title, body_markdown')
              .in('shift_id', shiftIds);
            
            if (shiftTemplates) {
              shiftTemplates.forEach((template: any) => {
                templateMap.set(template.shift_id, template);
              });
            }
          } catch (err) {
            console.warn('Failed to fetch shift-specific templates:', err);
          }
        }
        
        const enrichedData = data.map((contract: any) => {
          const companyData = companyMap.get(contract.company_id) || {};
          const shiftTemplate = contract.shift_id ? templateMap.get(contract.shift_id) : null;
          return {
            ...contract,
            company: companyData,
            template: shiftTemplate || null
          };
        });
        
        setPendingContracts(enrichedData || []);
      } else {
        setPendingContracts([]);
      }
    } catch (error) {
      console.warn('Error fetching pending contracts:', error);
    }
  }, [user?.id]);

  // Fetch approved shifts count
  const fetchApprovedShifts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('shift_assignments')
        .select('id, shift_id')
        .eq('promoter_id', user.id)
        .eq('certificate_approved', true);

      if (error) throw error;

      setApprovedShiftsCount(data?.length || 0);
      setApprovedShiftIds(new Set(data?.map(a => a.shift_id) || []));
    } catch (error) {
      console.error('Error fetching approved shifts:', error);
    }
  }, [user?.id]);

  const fetchRecentTimeLogs = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select(`
          id,
          shift_id,
          check_in_time,
          total_hours,
          earnings
        `)
        .eq('user_id', user.id)
        .not('check_out_time', 'is', null)
        .order('check_in_time', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      
      // Get shift details
      const shiftIds = [...new Set(data?.map(log => log.shift_id) || [])];
      if (shiftIds.length > 0) {
        const { data: shiftsData } = await supabase
          .from('shifts')
          .select('id, title')
          .in('id', shiftIds);
        
        const shiftMap = new Map(shiftsData?.map(s => [s.id, s]) || []);
        
        const logsWithDetails = data?.map(log => ({
          ...log,
          shift_title: shiftMap.get(log.shift_id)?.title || 'Unknown Shift'
        })) || [];
        
        setRecentTimeLogs(logsWithDetails);
      } else {
        setRecentTimeLogs(data || []);
      }
    } catch (error) {
      console.error('Error fetching recent time logs:', error);
    }
  }, [user?.id]);

  // Fetch actual earnings from time_logs
  const fetchActualEarnings = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Fetch completed time logs
      const { data: completedLogs } = await supabase
        .from('time_logs')
        .select('shift_id, earnings')
        .eq('user_id', user.id)
        .not('check_out_time', 'is', null);
      
      const total = completedLogs?.reduce((sum, log) => sum + (log.earnings || 0), 0) || 0;
      
      // Get unpaid shifts
      const shiftIds = [...new Set(completedLogs?.map(l => l.shift_id) || [])];
      let unpaid = 0;
      
      if (shiftIds.length > 0) {
        const { data: unpaidShifts } = await supabase
          .from('shifts')
          .select('id')
          .in('id', shiftIds)
          .eq('is_paid', false);
        
        const unpaidShiftIds = new Set(unpaidShifts?.map(s => s.id) || []);
        unpaid = completedLogs?.filter(log => unpaidShiftIds.has(log.shift_id))
          .reduce((sum, log) => sum + (log.earnings || 0), 0) || 0;
      }
      
      setActualEarnings({ total, unpaid });
      
      // Build earnings map
      const earningsMap = new Map<string, number>();
      completedLogs?.forEach(log => {
        const current = earningsMap.get(log.shift_id) || 0;
        earningsMap.set(log.shift_id, current + (log.earnings || 0));
      });
      
      // Fetch extra payments for this promoter
      const { data: extraPayments } = await (supabase as any)
        .from('extra_payments')
        .select('shift_id, amount')
        .eq('promoter_id', user.id);
      
      const extraTotal = extraPayments?.reduce((sum: number, ep: any) => sum + (ep.amount || 0), 0) || 0;
      setExtraPaymentsTotal(extraTotal);
      
      // Add extra payments to earnings map
      extraPayments?.forEach((ep: any) => {
        const current = earningsMap.get(ep.shift_id) || 0;
        earningsMap.set(ep.shift_id, current + (ep.amount || 0));
      });
      
      setShiftEarnings(earningsMap);
      
      // Fetch active session (time log without check_out_time)
      const { data: activeLog } = await supabase
        .from('time_logs')
        .select('id, shift_id, check_in_time')
        .eq('user_id', user.id)
        .is('check_out_time', null)
        .maybeSingle();
      
      if (activeLog) {
        // Fetch shift details for active session
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('title, pay_rate, pay_rate_type')
          .eq('id', activeLog.shift_id)
          .single();
        
        setActiveSession({
          id: activeLog.id,
          shift_id: activeLog.shift_id,
          check_in_time: activeLog.check_in_time,
          shift_title: shiftData?.title || 'Unknown Shift',
          pay_rate: shiftData?.pay_rate || 0,
          pay_rate_type: shiftData?.pay_rate_type || 'hourly'
        });
      } else {
        setActiveSession(null);
        setLiveElapsedSeconds(0);
        setLiveEarnings(0);
      }
    } catch (error) {
      console.error('Error fetching actual earnings:', error);
    }
  }, [user?.id]);
  
  // Live counter effect for active session
  useEffect(() => {
    if (!activeSession?.check_in_time) {
      return;
    }

    const updateLiveCounter = () => {
      const { elapsedHours, currentEarnings } = calculateLiveEarnings(
        activeSession.check_in_time,
        activeSession.pay_rate,
        activeSession.pay_rate_type
      );
      setLiveElapsedSeconds(elapsedHours * 3600);
      setLiveEarnings(currentEarnings);
    };

    // Initial update
    updateLiveCounter();

    // Update every second
    const interval = setInterval(updateLiveCounter, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAssignedShifts(),
      fetchPendingAssignments(),
      fetchPendingContracts(),
      fetchApprovedShifts(),
      fetchRecentTimeLogs(),
      fetchActualEarnings()
    ]);
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  }, [fetchAssignedShifts, fetchPendingAssignments, fetchPendingContracts, fetchApprovedShifts, fetchRecentTimeLogs, fetchActualEarnings]);

  // Initial data fetch
  useEffect(() => {
    if (!user?.id) return;

    fetchAssignedShifts();
    fetchPendingAssignments();
    fetchPendingContracts();
    fetchApprovedShifts();
    fetchRecentTimeLogs();
    fetchActualEarnings();
  }, [user?.id, fetchAssignedShifts, fetchPendingAssignments, fetchPendingContracts, fetchApprovedShifts, fetchRecentTimeLogs, fetchActualEarnings]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('promoter-dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shift_assignments',
        filter: `promoter_id=eq.${user.id}`
      }, () => {
        fetchAssignedShifts(); // This will update approval status map
        fetchPendingAssignments();
        fetchApprovedShifts();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'time_logs',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchRecentTimeLogs();
        fetchActualEarnings();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'company_contract_acceptances',
        filter: `promoter_id=eq.${user.id}`
      }, () => {
        fetchPendingContracts();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'extra_payments',
        filter: `promoter_id=eq.${user.id}`
      }, (payload) => {
        // Show toast for new extra payment
        const newPayment = payload.new as any;
        const typeLabel = newPayment.type === 'bonus' ? 'Bonus' : 
                         newPayment.type === 'overtime' ? 'Overtime' : 'Extra Task';
        toast.success(`New ${typeLabel} Payment!`, {
          description: `You received BHD ${Number(newPayment.amount).toFixed(3)}`
        });
        fetchActualEarnings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchAssignedShifts, fetchPendingAssignments, fetchPendingContracts, fetchApprovedShifts, fetchRecentTimeLogs, fetchActualEarnings]);

  const handleCopyCode = async () => {
    if (user?.unique_code) {
      try {
        await navigator.clipboard.writeText(user.unique_code);
        setCopied(true);
        toast.success("Code copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error("Failed to copy code");
      }
    }
  };

  // Open shift history modal with details
  const handleViewHistoryShift = async (shift: Shift) => {
    setSelectedHistoryShift(shift);
    setHistoryModalOpen(true);
    
    if (!user?.id) return;
    
    try {
      // Fetch time logs for this shift
      const { data: logs } = await supabase
        .from('time_logs')
        .select('id, check_in_time, check_out_time, total_hours, earnings')
        .eq('shift_id', shift.id)
        .eq('user_id', user.id)
        .order('check_in_time', { ascending: false });
      
      setSelectedShiftTimeLogs(logs || []);
      
      // Fetch extra payments for this shift
      const { data: extras } = await (supabase as any)
        .from('extra_payments')
        .select('id, amount, type, description, created_at')
        .eq('shift_id', shift.id)
        .eq('promoter_id', user.id)
        .order('created_at', { ascending: false });
      
      setSelectedShiftExtras(extras || []);
    } catch (error) {
      console.error('Error fetching shift details:', error);
    }
  };

  const isLoading = externalLoading || shiftsLoading;
  
  // Format live duration with seconds
  const formatLiveDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };
  
  // Total earnings including live session and extra payments
  const totalEarningsWithLive = actualEarnings.total + liveEarnings + extraPaymentsTotal;

  if (isLoading && assignedShifts.length === 0) {
    return (
      <div className="space-y-8 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-8 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            My Dashboard
          </h1>
          <p className="text-muted-foreground">Track your shifts and working hours</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshAll}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Active Session Card - Shows when promoter is currently checked in */}
        {activeSession && (
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 animate-pulse-slow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-green-600">
                <Play className="h-5 w-5 fill-current" />
                Currently Working
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>{activeSession.shift_title}</span>
                <span className="text-xs text-muted-foreground">
                  • Started at {formatDate(new Date(activeSession.check_in_time), "HH:mm")}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-green-500/10 rounded-lg text-center">
                  <Timer className="h-5 w-5 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600 tabular-nums">
                    {formatLiveDuration(liveElapsedSeconds)}
                  </p>
                  <p className="text-xs text-muted-foreground">Time Elapsed</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg text-center">
                  <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600 tabular-nums">
                    {formatBHD(liveEarnings)}
                  </p>
                  <p className="text-xs text-muted-foreground">Earnings So Far</p>
                </div>
              </div>
              <Button 
                onClick={() => navigate(`/shifts/${activeSession.shift_id}`)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Shift Details
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Unique Promoter Code Card */}
        {user?.unique_code && (
          <Card className="transition-all duration-500 shadow-md border-primary/20 hover:shadow-lg bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Your Unique Promoter Code
              </CardTitle>
              <CardDescription>Use this code when companies assign you to shifts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                <code className="flex-1 text-2xl font-mono font-bold text-primary tracking-wider">
                  {user.unique_code}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  Companies can use this code to quickly find and assign you to shifts
                </p>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <PromoterRatingBadge promoterId={user.id} size="sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Stats cards */}
        <DashboardStats 
          upcomingShifts={upcomingShifts}
          nextShift={nextShift}
          completedShifts={completedShifts}
          totalEarned={totalEarningsWithLive}
          unpaidAmount={actualEarnings.unpaid + (activeSession ? liveEarnings : 0)}
        />
        
        {/* Pending Contracts Section */}
        {pendingContracts.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Contracts Awaiting Approval
              </CardTitle>
              <CardDescription>
                You have {pendingContracts.length} contract{pendingContracts.length !== 1 ? 's' : ''} to review and approve before starting your shifts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {pendingContracts.map((contract: any) => (
                  <div key={contract.id} className="p-4 rounded-lg bg-background/50 border border-amber-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{contract.template?.title || 'Shift Contract'}</p>
                        <p className="text-sm font-semibold text-foreground mt-1">
                          Company Name: {contract.company?.company_name || contract.company?.full_name || 'Unknown Company'}
                        </p>
                        {contract.shifts && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">📅 {contract.shifts.title || 'Unnamed Shift'}</p>
                            <p>📆 {contract.shifts.date ? new Date(contract.shifts.date + 'T00:00:00').toLocaleDateString() : 'Date TBD'}</p>
                            <p>⏰ {contract.shifts.start_time || '--:--'} - {contract.shifts.end_time || '--:--'}</p>
                            {contract.shifts.location && <p>📍 {contract.shifts.location}</p>}
                            {contract.shifts.pay_rate > 0 && (
                              <p className="text-green-600 font-semibold mt-2">
                                💰 Payment Rate: {formatBHD(contract.shifts.pay_rate)} per {contract.shifts.pay_rate_type || 'hour'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/contracts?contract=${contract.id}`)}
                        className="shrink-0"
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate("/contracts")} className="w-full md:w-auto">
                <CheckCircle className="mr-2 h-4 w-4" />
                Review & Approve All Contracts
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending Shifts Section - Need to Accept */}
        {pendingAssignments.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                Shifts Awaiting Your Approval
              </CardTitle>
              <CardDescription>
                You have been assigned to {pendingAssignments.length} shift{pendingAssignments.length !== 1 ? 's' : ''} that need your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingAssignments.map((assignment: any) => (
                  <div key={assignment.id} className="p-4 rounded-lg bg-background/50 border border-blue-500/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{assignment.shifts?.title || 'Unnamed Shift'}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        From {assignment.shifts?.company_name || 'Unknown Company'}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <p>📅 {assignment.shifts?.date ? new Date(assignment.shifts.date).toLocaleDateString() : 'Date TBD'}</p>
                        <p>⏰ {assignment.shifts?.start_time || '--:--'} - {assignment.shifts?.end_time || '--:--'}</p>
                        <p>📍 {assignment.shifts?.location || 'Location TBD'}</p>
                        <p className="text-green-600 font-medium">💰 {formatCurrency((assignment.shifts?.pay_rate || 0) * (8))} (estimated)</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-col">
                      <ApproveShiftDialog 
                        assignmentId={assignment.id}
                        shiftTitle={assignment.shifts?.title || 'Unnamed Shift'}
                        companyName={assignment.shifts?.company_name || 'Unknown Company'}
                        onSuccess={() => {
                          fetchPendingAssignments();
                          fetchAssignedShifts();
                        }}
                      />
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/shifts/${assignment.shifts?.id}`)}
                        className="w-full md:w-auto"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> You must approve these shifts and any associated contracts before you can check in.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Approved Work Section */}
        {approvedShiftsCount > 0 && (
          <Card className="bg-gradient-to-r from-green-500/10 to-primary/10 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Approved Work
              </CardTitle>
              <CardDescription>
                You have {approvedShiftsCount} approved shift{approvedShiftsCount !== 1 ? 's' : ''} ready for certification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/certificates")} className="w-full md:w-auto">
                <Award className="mr-2 h-4 w-4" />
                Generate Certificate
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Recent Time Logs Section */}
        {recentTimeLogs.length > 0 && (
          <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Time Logs
              </CardTitle>
              <CardDescription>Your latest tracked work sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTimeLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                    <div>
                      <h3 className="font-medium text-sm">{log.shift_title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.check_in_time).toLocaleDateString()} • {Math.round(log.total_hours || 0)}h
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(log.earnings || 0)}
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/time-history')}
              >
                View All History
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Certificate generation card */}
        <Card className="transition-all duration-500 delay-50 shadow-sm border-border/50 hover:shadow-md bg-gradient-to-r from-secondary/20 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Work Certificates
            </CardTitle>
            <CardDescription>
              Generate professional work certificates from your approved shifts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Create official certificates showing your completed work hours from all companies.
              Perfect for including with job applications!
            </p>
            <Button 
              onClick={() => navigate("/certificates")}
              className="w-full md:w-auto"
            >
              <Award className="mr-2 h-4 w-4" />
              View Certificates
            </Button>
          </CardContent>
        </Card>
        
        {/* Current/Next shift */}
        <div className="transition-all duration-500 delay-100 transform hover:scale-[1.01]">
          <NextShiftCard 
            nextShift={nextShift}
            isCurrentShift={isCurrentShift}
            onViewDetails={() => nextShift && navigate(`/shifts/${nextShift.id}`)}
          />
        </div>
        
        {/* Upcoming shifts list */}
        {upcomingShifts.length > 1 && (
          <div className="transition-all duration-500 delay-200">
            <UpcomingShiftsList 
              shifts={upcomingShifts.slice(1)}
              onViewAll={() => navigate("/shifts")}
              onSelectShift={(shift) => navigate(`/shifts/${shift.id}`)}
            />
          </div>
        )}
        
        {/* Shift History */}
        {completedShiftsList.length > 0 && (
          <Card className="transition-all duration-500 delay-300 shadow-sm border-border/50 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Shift History
                  </CardTitle>
                  <CardDescription>Your completed shifts and earnings</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {completedShiftsList.length} completed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedShiftsList.slice(0, 5).map((shift) => (
                  <div 
                    key={shift.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                    onClick={() => handleViewHistoryShift(shift)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{shift.title}</h3>
                        <Badge variant="outline" className="text-xs bg-gray-500/10 text-gray-600 border-gray-500/20">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                          Completed
                        </Badge>
                        {(() => {
                          const approval = shiftApprovalStatus.get(shift.id);
                          if (approval?.work_approved) {
                            return (
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                Approved
                              </Badge>
                            );
                          } else {
                            return (
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                Pending Approval
                              </Badge>
                            );
                          }
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(shift.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {shift.endDate && shift.endDate !== shift.date && (
                          <> - {new Date(shift.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</>
                        )}
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3" />
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(shiftEarnings.get(shift.id) || 0)}
                    </div>
                  </div>
                ))}
              </div>
              {completedShiftsList.length > 5 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate('/shifts?filter=completed')}
                >
                  View All History ({completedShiftsList.length} shifts)
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Shift History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {selectedHistoryShift?.title || 'Shift Details'}
            </DialogTitle>
            <DialogDescription>
              Completed shift details and work history
            </DialogDescription>
          </DialogHeader>
          
          {selectedHistoryShift && (
            <div className="space-y-4 mt-2">
              {/* Shift Info */}
              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(selectedHistoryShift.date).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                    {selectedHistoryShift.endDate && selectedHistoryShift.endDate !== selectedHistoryShift.date && (
                      <> - {new Date(selectedHistoryShift.endDate).toLocaleDateString(undefined, { 
                        month: 'long', 
                        day: 'numeric' 
                      })}</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedHistoryShift.startTime} - {selectedHistoryShift.endTime}</span>
                </div>
                {selectedHistoryShift.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedHistoryShift.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatBHD(selectedHistoryShift.payRate || 0)} / {selectedHistoryShift.payRateType || 'hr'}</span>
                </div>
              </div>

              {/* Earnings Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-lg p-3 text-center">
                  <Timer className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">
                    {selectedShiftTimeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0).toFixed(1)}h
                  </p>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                </div>
                <div className="bg-green-500/5 rounded-lg p-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-bold text-green-600">
                    {formatBHD(
                      selectedShiftTimeLogs.reduce((sum, log) => sum + (log.earnings || 0), 0) +
                      selectedShiftExtras.reduce((sum, ep) => sum + (ep.amount || 0), 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Earnings</p>
                </div>
              </div>

              {/* Work Sessions */}
              {selectedShiftTimeLogs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <History className="h-4 w-4" />
                    Work Sessions ({selectedShiftTimeLogs.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedShiftTimeLogs.map((log) => (
                      <div 
                        key={log.id}
                        className="flex items-center justify-between p-2 bg-secondary/30 rounded-md text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {formatDate(new Date(log.check_in_time), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(log.check_in_time), 'HH:mm')} → {' '}
                            {log.check_out_time 
                              ? formatDate(new Date(log.check_out_time), 'HH:mm')
                              : 'Active'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          {log.total_hours !== null && (
                            <p className="font-medium">{log.total_hours.toFixed(1)}h</p>
                          )}
                          {log.earnings !== null && (
                            <p className="text-xs text-green-600">{formatBHD(log.earnings)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Payments */}
              {selectedShiftExtras.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    Extra Payments ({selectedShiftExtras.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedShiftExtras.map((ep) => (
                      <div 
                        key={ep.id}
                        className="flex items-center justify-between p-2 bg-amber-500/10 rounded-md text-sm"
                      >
                        <div>
                          <p className="font-medium capitalize">{ep.type.replace('_', ' ')}</p>
                          {ep.description && (
                            <p className="text-xs text-muted-foreground">{ep.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(new Date(ep.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        <span className="font-bold text-green-600">{formatBHD(ep.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setHistoryModalOpen(false);
                    navigate(`/shifts/${selectedHistoryShift.id}`);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
