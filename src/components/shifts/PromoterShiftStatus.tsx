import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  DollarSign,
  Timer,
  History,
  Play,
  Gift,
  Briefcase,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatBHD, calculateLiveEarnings } from "./utils/paymentCalculations";
import { Shift } from "./types/ShiftTypes";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type PromoterShiftStatusProps = {
  shift: Shift;
  shiftId: string;
};

type Assignment = {
  id: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  auto_checkin_enabled: boolean;
  auto_checkout_enabled: boolean;
};

type TimeLog = {
  id: string;
  check_in_time: string;
  check_out_time: string | null;
  total_hours: number | null;
  earnings: number | null;
};

type ExtraPayment = {
  id: string;
  amount: number;
  type: 'bonus' | 'overtime' | 'extra_task';
  description: string | null;
  created_at: string;
};

export const PromoterShiftStatus = ({ shift, shiftId }: PromoterShiftStatusProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [alerting, setAlerting] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  // Live counter state
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const [liveEarnings, setLiveEarnings] = useState(0);
  
  // Extra payments state
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
  const [showExtras, setShowExtras] = useState(false);
  const [lastExtraPaymentCount, setLastExtraPaymentCount] = useState(0);
  
  // Approval status state
  const [workApproved, setWorkApproved] = useState(false);
  const [workApprovedAt, setWorkApprovedAt] = useState<string | null>(null);

  // Check if currently checked in (has a log with no check_out_time)
  const activeLog = timeLogs.find(log => !log.check_out_time);
  const isCheckedIn = !!activeLog;

  // Calculate totals from completed logs
  const completedHours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
  const completedEarnings = timeLogs.reduce((sum, log) => sum + (log.earnings || 0), 0);
  
  // Calculate extra payments total
  const totalExtraPayments = extraPayments.reduce((sum, ep) => sum + (ep.amount || 0), 0);
  
  // Total includes live values when checked in + extras
  const totalHours = completedHours + (isCheckedIn ? liveElapsedSeconds / 3600 : 0);
  const baseEarnings = completedEarnings + (isCheckedIn ? liveEarnings : 0);
  const totalEarnings = baseEarnings + totalExtraPayments;

  // Determine current status
  const getStatus = () => {
    if (isCheckedIn) return "checked_in";
    if (timeLogs.length > 0 && timeLogs.every(log => log.check_out_time)) return "done";
    return "not_started";
  };
  const status = getStatus();

  // Check if promoter should be working now (within scheduled time on a shift day)
  const isWithinScheduledTime = () => {
    if (!assignment) return false;
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    const shiftDate = new Date(shift.date);
    const endDate = shift.endDate ? new Date(shift.endDate) : shiftDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isWithinDateRange = today >= shiftDate && today <= endDate;
    const isWithinTime = currentTime >= assignment.scheduled_start_time && 
                         currentTime <= assignment.scheduled_end_time;
    
    return isWithinDateRange && isWithinTime;
  };

  const shouldShowAlert = isWithinScheduledTime() && !isCheckedIn;

  // Live counter effect - updates every second when checked in
  useEffect(() => {
    if (!isCheckedIn || !activeLog?.check_in_time) {
      setLiveElapsedSeconds(0);
      setLiveEarnings(0);
      return;
    }

    const updateLiveCounter = () => {
      const { elapsedHours, currentEarnings } = calculateLiveEarnings(
        activeLog.check_in_time,
        shift.payRate || 0,
        shift.payRateType || 'hourly'
      );
      setLiveElapsedSeconds(elapsedHours * 3600);
      setLiveEarnings(currentEarnings);
    };

    // Initial update
    updateLiveCounter();

    // Update every second
    const interval = setInterval(updateLiveCounter, 1000);

    return () => clearInterval(interval);
  }, [isCheckedIn, activeLog?.check_in_time, shift.payRate, shift.payRateType]);

  // Fetch extra payments
  const fetchExtraPayments = useCallback(async () => {
    if (!user?.id || !assignment?.id) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('extra_payments')
        .select('id, amount, type, description, created_at')
        .eq('shift_assignment_id', assignment.id)
        .eq('promoter_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching extra payments:', error);
        return;
      }
      
      const newPayments = data || [];
      
      // Show toast if new extra payment was added
      if (lastExtraPaymentCount > 0 && newPayments.length > lastExtraPaymentCount) {
        const latestPayment = newPayments[0];
        const typeLabel = latestPayment.type === 'bonus' ? 'Bonus' : 
                         latestPayment.type === 'overtime' ? 'Overtime' : 'Extra Task';
        toast.success(`New ${typeLabel} Payment Added!`, {
          description: `You received BHD ${latestPayment.amount.toFixed(3)}${latestPayment.description ? ` - ${latestPayment.description}` : ''}`
        });
      }
      
      setExtraPayments(newPayments);
      setLastExtraPaymentCount(newPayments.length);
    } catch (err) {
      console.error('Error fetching extra payments:', err);
    }
  }, [user?.id, assignment?.id, lastExtraPaymentCount]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      setLoading(true);

      try {
        // Fetch assignment details including approval status
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("shift_assignments")
          .select("id, scheduled_start_time, scheduled_end_time, auto_checkin_enabled, auto_checkout_enabled, work_approved, work_approved_at")
          .eq("shift_id", shiftId)
          .eq("promoter_id", user.id)
          .maybeSingle();

        if (assignmentError) {
          console.error("Error fetching assignment:", assignmentError);
        } else if (assignmentData) {
          setAssignment(assignmentData);
          setWorkApproved(assignmentData.work_approved || false);
          setWorkApprovedAt(assignmentData.work_approved_at || null);
        }

        // Fetch time logs for this shift
        const { data: logsData, error: logsError } = await supabase
          .from("time_logs")
          .select("id, check_in_time, check_out_time, total_hours, earnings")
          .eq("shift_id", shiftId)
          .eq("user_id", user.id)
          .order("check_in_time", { ascending: false });

        if (logsError) {
          console.error("Error fetching time logs:", logsError);
        } else {
          setTimeLogs(logsData || []);
        }

        // Fetch company_id from shift
        const { data: shiftData } = await supabase
          .from("shifts")
          .select("company_id")
          .eq("id", shiftId)
          .single();
        
        if (shiftData) {
          setCompanyId(shiftData.company_id);
        }
      } catch (error) {
        console.error("Error fetching promoter status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, shiftId]);

  // Fetch extra payments when assignment is loaded
  useEffect(() => {
    if (assignment?.id) {
      fetchExtraPayments();
    }
  }, [assignment?.id, fetchExtraPayments]);

  // Real-time subscription for extra payments
  useEffect(() => {
    if (!user?.id || !shiftId) return;

    const channel = supabase
      .channel(`extra_payments_promoter_${shiftId}_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "extra_payments",
          filter: `promoter_id=eq.${user.id}`,
        },
        (payload) => {
          // Check if this payment is for this shift
          if (payload.new && (payload.new as any).shift_id === shiftId) {
            fetchExtraPayments();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, shiftId, fetchExtraPayments]);

  // Real-time subscription for approval status
  useEffect(() => {
    if (!user?.id || !shiftId || !assignment?.id) return;

    const channel = supabase
      .channel(`approval_status_${shiftId}_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shift_assignments",
          filter: `id=eq.${assignment.id}`,
        },
        (payload) => {
          if (payload.new) {
            setWorkApproved((payload.new as any).work_approved || false);
            setWorkApprovedAt((payload.new as any).work_approved_at || null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, shiftId, assignment?.id]);

  const handleAlertCompany = async () => {
    if (!user?.id || !companyId) return;
    
    setAlerting(true);
    try {
      // Create a notification for the company
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: companyId,
          type: "check_in_alert",
          title: "Promoter Check-in Alert",
          message: `${user.user_metadata?.full_name || "A promoter"} is on duty for "${shift.title}" but hasn't been checked in yet.`,
          data: {
            shift_id: shiftId,
            promoter_id: user.id,
            shift_title: shift.title
          }
        });

      if (error) throw error;

      toast.success("Alert sent to company", {
        description: "The company has been notified that you're on duty."
      });
    } catch (error: any) {
      console.error("Error sending alert:", error);
      toast.error("Failed to send alert", {
        description: "Please try again or contact the company directly."
      });
    } finally {
      setAlerting(false);
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatLiveDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!assignment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Not Assigned
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            You are not assigned to this shift.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Your Attendance Status
        </CardTitle>
        <CardDescription>
          Monitor your work progress for this shift
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Status:</span>
          {status === "checked_in" && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Checked In
            </Badge>
          )}
          {status === "done" && (
            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Work Completed
            </Badge>
          )}
          {status === "not_started" && (
            <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
              Not Started
            </Badge>
          )}
        </div>

        {/* Work Approval Status - Show when work is completed */}
        {status === "done" && (
          <div className={`rounded-lg p-3 border ${
            workApproved 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {workApproved ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Work Approved</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-600">Pending Approval</span>
                  </>
                )}
              </div>
              {workApproved && workApprovedAt && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(workApprovedAt), "MMM d, yyyy 'at' HH:mm")}
                </span>
              )}
            </div>
            {workApproved && (
              <p className="text-xs text-muted-foreground mt-1">
                You can now generate a certificate for this shift
              </p>
            )}
            {!workApproved && (
              <p className="text-xs text-muted-foreground mt-1">
                Waiting for company to approve your work
              </p>
            )}
          </div>
        )}

        {/* Schedule Info */}
        <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Scheduled:
            </span>
            <span className="font-medium">
              {assignment.scheduled_start_time} - {assignment.scheduled_end_time}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Auto Attendance:</span>
            <div className="flex gap-2">
              {assignment.auto_checkin_enabled && (
                <Badge variant="outline" className="text-xs">Auto Check-in</Badge>
              )}
              {assignment.auto_checkout_enabled && (
                <Badge variant="outline" className="text-xs">Auto Check-out</Badge>
              )}
              {!assignment.auto_checkin_enabled && !assignment.auto_checkout_enabled && (
                <span className="text-xs text-muted-foreground">Manual</span>
              )}
            </div>
          </div>
        </div>

        {/* Live Session Banner - Only show when checked in */}
        {isCheckedIn && activeLog && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                <Play className="h-3.5 w-3.5 fill-current" />
                Live Session
              </span>
              <span className="text-xs text-muted-foreground">
                Started: {format(new Date(activeLog.check_in_time), "HH:mm")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xl font-bold text-green-600 tabular-nums">
                  {formatLiveDuration(liveElapsedSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">Elapsed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600 tabular-nums">
                  {formatBHD(liveEarnings)}
                </p>
                <p className="text-xs text-muted-foreground">Earning</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 text-center">
            <Timer className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{isCheckedIn ? formatLiveDuration(liveElapsedSeconds + completedHours * 3600) : formatDuration(totalHours)}</p>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </div>
          <div className="bg-green-500/5 rounded-lg p-3 text-center">
            <DollarSign className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-green-600">{formatBHD(totalEarnings)}</p>
            <p className="text-xs text-muted-foreground">Total Earnings</p>
            {totalExtraPayments > 0 && (
              <p className="text-[10px] text-muted-foreground">
                (incl. +{formatBHD(totalExtraPayments)} extras)
              </p>
            )}
          </div>
        </div>

        {/* Extra Payments Section */}
        {extraPayments.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg overflow-hidden">
            <button 
              onClick={() => setShowExtras(!showExtras)}
              className="w-full flex items-center justify-between p-3 hover:bg-amber-500/10 transition-colors"
            >
              <span className="text-sm font-medium flex items-center gap-2 text-amber-600">
                <Gift className="h-4 w-4" />
                Extra Payments ({extraPayments.length})
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-600">{formatBHD(totalExtraPayments)}</span>
                {showExtras ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
            
            {showExtras && (
              <div className="border-t border-amber-500/20 p-3 space-y-2">
                {extraPayments.map((ep) => (
                  <div 
                    key={ep.id}
                    className="flex items-center justify-between p-2 bg-background rounded-md text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {ep.type === 'bonus' && <Gift className="h-3.5 w-3.5 text-amber-500" />}
                      {ep.type === 'overtime' && <Clock className="h-3.5 w-3.5 text-blue-500" />}
                      {ep.type === 'extra_task' && <Briefcase className="h-3.5 w-3.5 text-purple-500" />}
                      <div>
                        <p className="font-medium capitalize">
                          {ep.type.replace('_', ' ')}
                        </p>
                        {ep.description && (
                          <p className="text-xs text-muted-foreground">{ep.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(ep.created_at), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">{formatBHD(ep.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alert Button - Only show if should be working but not checked in */}
        {shouldShowAlert && (
          <Button 
            onClick={handleAlertCompany}
            disabled={alerting}
            variant="outline"
            className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
          >
            <Bell className="h-4 w-4 mr-2" />
            {alerting ? "Sending Alert..." : "Alert Company - Not Checked In"}
          </Button>
        )}

        <Separator />

        {/* Shift Work History */}
        <div>
          <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
            <History className="h-4 w-4" />
            Work Sessions for This Shift
          </h4>
          
          {timeLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No work sessions recorded yet
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeLogs.map((log) => (
                <div 
                  key={log.id}
                  className="flex items-center justify-between p-2 bg-secondary/30 rounded-md text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(log.check_in_time), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.check_in_time), "HH:mm")} → {" "}
                      {log.check_out_time 
                        ? format(new Date(log.check_out_time), "HH:mm")
                        : "In Progress"}
                    </p>
                  </div>
                  <div className="text-right">
                    {log.check_out_time ? (
                      <>
                        {log.total_hours !== null && (
                          <p className="font-medium">{formatDuration(log.total_hours)}</p>
                        )}
                        {log.earnings !== null && (
                          <p className="text-xs text-green-600">{formatBHD(log.earnings)}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-green-600 tabular-nums">
                          {formatLiveDuration(liveElapsedSeconds)}
                        </p>
                        <p className="text-xs text-green-600">{formatBHD(liveEarnings)}</p>
                        <Badge className="bg-green-500/10 text-green-600 text-xs mt-1">
                          Active
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

