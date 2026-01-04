
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shift } from "../shifts/types/ShiftTypes";
import DashboardStats from "./components/DashboardStats";
import NextShiftCard from "./components/NextShiftCard";
import UpcomingShiftsList from "./components/UpcomingShiftsList";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useState, useEffect } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { Button } from "../ui/button";
import { Award, Copy, Check, CheckCircle, Clock, Star, AlertCircle } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { getEffectiveStatus } from "../shifts/utils/statusCalculations";
import { Badge } from "../ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PromoterRatingBadge } from "@/components/ratings/PromoterRatingBadge";
import { ApproveShiftDialog } from "../shifts/pendingApproval/ApproveShiftDialog";

type PromoterDashboardProps = {
  shifts: Shift[];
  loading?: boolean;
};

export default function PromoterDashboard({ shifts, loading = false }: PromoterDashboardProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const { format } = useCurrency();
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [approvedShiftsCount, setApprovedShiftsCount] = useState(0);
  const [approvedShiftIds, setApprovedShiftIds] = useState<Set<string>>(new Set());
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [pendingContracts, setPendingContracts] = useState<any[]>([]);
  const [recentTimeLogs, setRecentTimeLogs] = useState<any[]>([]);
  const [actualEarnings, setActualEarnings] = useState<{ total: number; unpaid: number }>({ total: 0, unpaid: 0 });
  const [shiftEarnings, setShiftEarnings] = useState<Map<string, number>>(new Map());
  
  const { upcomingShifts, nextShift, completedShifts, totalEarned, unpaidAmount } = useDashboardData(shifts, actualEarnings);
  
  // Get completed shifts for display in the Recent Activity section
  const completedShiftsList = shifts.filter(shift => getEffectiveStatus(shift) === "completed");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch pending shift assignments (shifts assigned to promoter but not yet accepted)
  const fetchPendingAssignments = async () => {
    if (!user?.id) {
      console.log('No user ID, skipping pending assignments fetch');
      return;
    }
    
    console.log('Fetching pending assignments for user:', user.id);
    
    try {
      // Fetch assignments with shift details and company info
      const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
          id,
          status,
          shift_id,
          shifts!inner (
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
      
      console.log('Pending assignments raw data:', data);
      
      // Now fetch company details for each shift
      if (data && data.length > 0) {
        const companyIds = [...new Set(data.map(a => a.shifts?.company_id).filter(Boolean))];
        const { data: companies, error: companyError } = await supabase
          .from('profiles')
          .select('id, full_name, company_name')
          .in('id', companyIds);
        
        if (companyError) {
          console.error('Error fetching companies:', companyError);
        } else {
          console.log('Companies fetched:', companies);
          // Merge company data into assignments
          const enrichedData = data.map(assignment => ({
            ...assignment,
            shifts: {
              ...assignment.shifts,
              company: companies?.find(c => c.id === assignment.shifts?.company_id)
            }
          }));
          console.log('Enriched pending assignments:', enrichedData);
          setPendingAssignments(enrichedData);
          return;
        }
      }
      
      setPendingAssignments(data || []);
    } catch (error) {
      console.error('Error fetching pending assignments:', error);
      toast.error('Failed to load pending shifts');
    }
  };

  // Fetch pending contracts that need approval
  const fetchPendingContracts = async () => {
    if (!user?.id) {
      console.log('No user ID, skipping pending contracts fetch');
      return;
    }
    
    console.log('Fetching pending contracts for user:', user.id);
    
    try {
      const { data, error } = await (supabase as any)
        .from('company_contract_acceptances')
        .select(`
          id,
          company_id,
          status,
          company_contract_templates!inner (
            id,
            company_id,
            title
          )
        `)
        .eq('promoter_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching pending contracts (table may not exist):', error);
        // Don't throw - contract table might not exist yet
        return;
      }
      
      console.log('Pending contracts fetched:', data);
      setPendingContracts(data || []);
    } catch (error) {
      console.warn('Error fetching pending contracts:', error);
      // Don't show error toast for contracts as the table might not exist
    }
  };

  // Fetch approved shifts count and recent time logs
  const fetchApprovedShifts = async () => {
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
  };

  const fetchRecentTimeLogs = async () => {
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
      const { data: shiftsData } = await supabase
        .from('shift_assignments')
        .select(`
          shift_id,
          shifts!inner (
            id,
            title
          )
        `)
        .eq('promoter_id', user.id)
        .in('shift_id', shiftIds);
      
      const shiftMap = new Map(shiftsData?.map(s => [s.shift_id, s.shifts]) || []);
      
      const logsWithDetails = data?.map(log => ({
        ...log,
        shift_title: shiftMap.get(log.shift_id)?.title || 'Unknown Shift'
      })) || [];
      
      setRecentTimeLogs(logsWithDetails);
    } catch (error) {
      console.error('Error fetching recent time logs:', error);
    }
  };

  // Fetch actual earnings from time_logs for accurate dashboard stats
  const fetchActualEarnings = async () => {
    if (!user?.id) return;
    
    try {
      const { data: allTimeLogs } = await supabase
        .from('time_logs')
        .select('shift_id, earnings')
        .eq('user_id', user.id)
        .not('check_out_time', 'is', null);
      
      // Calculate total and unpaid earnings
      const total = allTimeLogs?.reduce((sum, log) => sum + (log.earnings || 0), 0) || 0;
      
      // Get unpaid shifts
      const { data: unpaidShifts } = await supabase
        .from('shifts')
        .select('id')
        .eq('is_paid', false);
      
      const unpaidShiftIds = new Set(unpaidShifts?.map(s => s.id) || []);
      const unpaid = allTimeLogs?.filter(log => unpaidShiftIds.has(log.shift_id))
        .reduce((sum, log) => sum + (log.earnings || 0), 0) || 0;
      
      setActualEarnings({ total, unpaid });
      
      // Build earnings map for Recent Activity section
      const earningsMap = new Map<string, number>();
      allTimeLogs?.forEach(log => {
        const current = earningsMap.get(log.shift_id) || 0;
        earningsMap.set(log.shift_id, current + (log.earnings || 0));
      });
      setShiftEarnings(earningsMap);
    } catch (error) {
      console.error('Error fetching actual earnings:', error);
    }
  };

  useEffect(() => {
    console.log('useEffect running with user:', user);
    console.log('useEffect running with user.id:', user?.id);
    
    if (!user?.id) {
      console.log('No user ID available, skipping fetch calls');
      return;
    }
    
    console.log('Calling fetch functions...');
    fetchApprovedShifts();
    fetchRecentTimeLogs();
    fetchActualEarnings();
    fetchPendingAssignments();
    fetchPendingContracts();
  }, [user?.id]);

  // Add real-time subscriptions for approvals and time logs
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('promoter-dashboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shift_assignments',
        filter: `promoter_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.certificate_approved) {
          fetchApprovedShifts();
          fetchRecentTimeLogs();
        }
        // Refetch pending assignments when status changes
        fetchPendingAssignments();
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  
  // Debug logging for troubleshooting
  console.log('PromoterDashboard render - pendingAssignments:', pendingAssignments);
  console.log('PromoterDashboard render - pendingContracts:', pendingContracts);
  
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

  if (loading) {
    return (
      <div className="space-y-8 p-4 md:p-6">
        <div className="space-y-2">
          <div className="h-10 bg-muted animate-pulse rounded-lg w-64" />
          <div className="h-5 bg-muted animate-pulse rounded w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-8 transition-all duration-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          My Dashboard
        </h1>
        <p className="text-muted-foreground">Track your shifts and working hours</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
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
        
        {/* Stats cards with staggered animation */}
        <DashboardStats 
          upcomingShifts={upcomingShifts}
          nextShift={nextShift}
          completedShifts={completedShifts}
          totalEarned={totalEarned}
          unpaidAmount={unpaidAmount}
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
                You have {pendingContracts.length} contract{pendingContracts.length !== 1 ? 's' : ''} to review and approve before working
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {pendingContracts.map((contract) => (
                  <div key={contract.id} className="p-3 rounded-lg bg-background/50 border border-amber-500/20">
                    <p className="font-medium text-sm">{contract.company_contract_templates?.title || 'Unnamed Contract'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pending your approval</p>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate("/contracts")} className="w-full md:w-auto">
                <CheckCircle className="mr-2 h-4 w-4" />
                Review & Approve Contracts
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
                        From {assignment.shifts?.company?.full_name || 'Unknown Company'}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <p>📅 {assignment.shifts?.date ? new Date(assignment.shifts.date).toLocaleDateString() : 'Date TBD'}</p>
                        <p>⏰ {assignment.shifts?.start_time || '--:--'} - {assignment.shifts?.end_time || '--:--'}</p>
                        <p>📍 {assignment.shifts?.location || 'Location TBD'}</p>
                        <p className="text-green-600 font-medium">💰 {format((assignment.shifts?.pay_rate || 0) * (8))} (estimated)</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-col">
                      <ApproveShiftDialog 
                        assignmentId={assignment.id}
                        shiftTitle={assignment.shifts?.title || 'Unnamed Shift'}
                        companyName={assignment.shifts?.company?.full_name || 'Unknown Company'}
                        onSuccess={fetchPendingAssignments}
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
        
        {/* Approved Work Section - Ready for Certificates */}
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
                      {format(log.earnings || 0)}
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
        
        {/* Next shift with subtle animation */}
        <div className="transition-all duration-500 delay-100 transform hover:scale-[1.01]">
          <NextShiftCard 
            nextShift={nextShift}
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
        
        {/* Recent activity card - adding a new section */}
        {completedShiftsList.length > 0 && (
          <Card className="transition-all duration-500 delay-300 shadow-sm border-border/50 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <CardDescription>Your latest completed shifts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedShiftsList.slice(0, 3).map((shift, index) => (
                  <div 
                    key={shift.id} 
                    className="flex items-center justify-between p-3 rounded-md bg-secondary/50 hover:bg-secondary cursor-pointer"
                    onClick={() => navigate(`/shifts/${shift.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{shift.title}</h3>
                        {approvedShiftIds.has(shift.id) && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="h-2.5 w-2.5 mr-1" />
                            Approved
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{shift.date} • {shift.startTime} - {shift.endTime}</p>
                    </div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {format(shiftEarnings.get(shift.id) || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
