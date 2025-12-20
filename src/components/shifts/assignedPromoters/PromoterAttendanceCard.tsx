
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { TimeLog, calculatePromoterPayment, formatWorkDuration, formatBHD } from "../utils/paymentCalculations";
import { Clock, Phone, User, X, LogIn, LogOut, Timer } from "lucide-react";
import { format } from "date-fns";
import { useUnassignPromoter } from "./hooks/useUnassignPromoter";
import { useCompanyCheckIn } from "./hooks/useCompanyCheckIn";
import { EditAssignmentDialog } from "./EditAssignmentDialog";
import { EditTimeLogDialog } from "./EditTimeLogDialog";
import { ManualCheckInDialog } from "./ManualCheckInDialog";
import { PromoterWorkHistory } from "./PromoterWorkHistory";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { isCompanyLike } from "@/utils/roleUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type PromoterAttendanceCardProps = {
  promoter: {
    id: string;
    promoter_id: string;
    full_name: string;
    unique_code: string;
    phone_number?: string;
    scheduled_start_time?: string;
    scheduled_end_time?: string;
    auto_checkin_enabled?: boolean;
    auto_checkout_enabled?: boolean;
    payment_status?: "scheduled" | "paid" | null;
    payment_scheduled_at?: string | null;
    payment_paid_at?: string | null;
  };
  timeLogs: TimeLog[];
  payRate: number;
  payRateType: string;
  shiftId: string;
  onUpdate?: () => void;
  userRole?: string;
};

export const PromoterAttendanceCard = ({
  promoter,
  timeLogs,
  payRate,
  payRateType,
  shiftId,
  onUpdate,
  userRole,
}: PromoterAttendanceCardProps) => {
  const { user } = useAuth();
  const { unassignPromoter, loading: unassigning } = useUnassignPromoter();
  const { checkIn, checkOut, manualCheckIn, loading: checkInOutLoading } = useCompanyCheckIn(shiftId, payRate, payRateType);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedEarnings, setEstimatedEarnings] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  
  const hasTimeLogs = timeLogs.length > 0;
  const totalHours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
  const payment = calculatePromoterPayment(timeLogs, payRate, payRateType);
  const latestLog = timeLogs.length > 0 ? timeLogs[timeLogs.length - 1] : null;
  const isCheckedIn = latestLog && !latestLog.check_out_time;
  
  const isCompany = isCompanyLike(userRole);
  const [payStatus, setPayStatus] = useState<"scheduled" | "paid" | null>(promoter.payment_status ?? null);
  const [payUpdating, setPayUpdating] = useState(false);

  useEffect(() => {
    setPayStatus(promoter.payment_status ?? null);
  }, [promoter.payment_status]);

  const markPaymentScheduled = async () => {
    if (!isCompany) return;
    setPayUpdating(true);
    try {
      await (supabase as any)
        .from("shift_assignment_payment_status")
        .upsert({
          assignment_id: promoter.id,
          status: "scheduled",
          scheduled_at: new Date().toISOString(),
          updated_by: user?.id,
        });
      setPayStatus("scheduled");
    } finally {
      setPayUpdating(false);
      onUpdate?.();
    }
  };

  const markPaymentPaid = async () => {
    if (!isCompany) return;
    setPayUpdating(true);
    try {
      await (supabase as any)
        .from("shift_assignment_payment_status")
        .upsert({
          assignment_id: promoter.id,
          status: "paid",
          paid_at: new Date().toISOString(),
          scheduled_at: promoter.payment_scheduled_at ?? new Date().toISOString(),
          updated_by: user?.id,
        });
      setPayStatus("paid");
    } finally {
      setPayUpdating(false);
      onUpdate?.();
    }
  };

  // Calculate elapsed time and estimated earnings for active check-ins
  useEffect(() => {
    if (!isCheckedIn || !latestLog?.check_in_time) return;

    const updateElapsed = () => {
      const checkIn = new Date(latestLog.check_in_time);
      const now = new Date();
      const hours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      setElapsedTime(hours * 3600); // Convert to seconds
      
      // Calculate estimated earnings
      let earnings = 0;
      switch (payRateType) {
        case 'hourly':
          earnings = hours * payRate;
          break;
        case 'daily':
          earnings = (hours / 8) * payRate;
          break;
        case 'monthly':
          earnings = (hours / 160) * payRate;
          break;
        case 'fixed':
          earnings = payRate;
          break;
        default:
          earnings = hours * payRate;
      }
      setEstimatedEarnings(earnings);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [isCheckedIn, latestLog, payRate, payRateType]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUnassign = async () => {
    await unassignPromoter(
      promoter.id,
      promoter.promoter_id,
      promoter.full_name,
      hasTimeLogs
    );
  };

  const handleCheckIn = async () => {
    const success = await checkIn(promoter.promoter_id, promoter.full_name);
    if (success) {
      onUpdate?.();
    }
  };

  const handleCheckOut = async () => {
    if (!latestLog?.check_in_time) return;
    const success = await checkOut(latestLog.id as any, promoter.full_name, latestLog.check_in_time);
    if (success) {
      onUpdate?.();
    }
  };

  const handleManualCheckIn = async (customTime?: Date) => {
    const success = await manualCheckIn(promoter.promoter_id, promoter.full_name, customTime);
    if (success) {
      onUpdate?.();
    }
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(promoter.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-sm">{promoter.full_name}</h4>
              <p className="text-xs text-muted-foreground">Code: {promoter.unique_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AttendanceStatusBadge timeLogs={timeLogs} />
            {(payStatus === "scheduled" || payStatus === "paid") && (
              <Badge variant={payStatus === "paid" ? "default" : "outline"}>
                {payStatus === "paid" ? "Paid" : "Payment Scheduled"}
              </Badge>
            )}
            {isCompany && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={unassigning}
                    title={hasTimeLogs ? "Cannot unassign promoter with attendance records" : "Unassign promoter"}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unassign Promoter</AlertDialogTitle>
                    <AlertDialogDescription>
                      {hasTimeLogs ? (
                        <>
                          Cannot unassign <strong>{promoter.full_name}</strong> because they have attendance records for this shift.
                        </>
                      ) : (
                        <>
                          Are you sure you want to unassign <strong>{promoter.full_name}</strong> from this shift?
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    {!hasTimeLogs && (
                      <AlertDialogAction onClick={handleUnassign} disabled={unassigning}>
                        {unassigning ? "Unassigning..." : "Unassign"}
                      </AlertDialogAction>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Scheduled Time */}
        {promoter.scheduled_start_time && promoter.scheduled_end_time && (
          <div className="p-2 bg-accent/30 rounded-md text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Scheduled:</span>
              <span className="font-medium">
                {promoter.scheduled_start_time} - {promoter.scheduled_end_time}
              </span>
            </div>
            {(promoter.auto_checkin_enabled || promoter.auto_checkout_enabled) && (
              <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                {promoter.auto_checkin_enabled && <span>• Auto check-in</span>}
                {promoter.auto_checkout_enabled && <span>• Auto check-out</span>}
              </div>
            )}
          </div>
        )}

        {/* Active Check-in Status */}
        {isCheckedIn && isCompany && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" />
                Currently Working
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Elapsed:</span>
                <p className="font-medium">{formatElapsedTime(elapsedTime)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Earnings:</span>
                <p className="font-medium text-green-600">{formatBHD(estimatedEarnings)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Check-in/out Controls */}
        {isCompany && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={payUpdating || payStatus === "scheduled" || payStatus === "paid"}
                onClick={markPaymentScheduled}
              >
                {payStatus === "scheduled" || payStatus === "paid" ? "Scheduled" : "Schedule Payment"}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={payUpdating || payStatus === "paid"}
                onClick={markPaymentPaid}
              >
                {payStatus === "paid" ? "Paid" : "Mark Paid"}
              </Button>
            </div>
            <div className="flex gap-2">
              {isCheckedIn && (
                <Button
                  onClick={handleCheckOut}
                  disabled={checkInOutLoading}
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Check Out
                </Button>
              )}
              <EditAssignmentDialog
                assignmentId={promoter.id}
                promoterName={promoter.full_name}
                currentStartTime={promoter.scheduled_start_time}
                currentEndTime={promoter.scheduled_end_time}
                currentAutoCheckIn={promoter.auto_checkin_enabled}
                currentAutoCheckOut={promoter.auto_checkout_enabled}
                hasTimeLogs={hasTimeLogs}
                onUpdate={onUpdate}
              />
            </div>
            
            {!isCheckedIn && (
              <div className="flex gap-2">
                <ManualCheckInDialog 
                  onCheckIn={handleManualCheckIn}
                  loading={checkInOutLoading}
                />
                <PromoterWorkHistory 
                  promoterId={promoter.promoter_id}
                  promoterName={promoter.full_name}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
          {latestLog?.check_in_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <div>
                <p className="text-xs">Check In</p>
                <p className="font-medium text-foreground">
                  {format(new Date(latestLog.check_in_time), "MMM dd, HH:mm")}
                </p>
                {latestLog.check_out_time && 
                 format(new Date(latestLog.check_in_time), "yyyy-MM-dd") !== 
                 format(new Date(latestLog.check_out_time), "yyyy-MM-dd") && (
                  <p className="text-[10px] text-orange-500 font-medium mt-0.5">Multi-day shift</p>
                )}
              </div>
            </div>
          )}

          {latestLog?.check_out_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <div>
                <p className="text-xs">Check Out</p>
                <p className="font-medium text-foreground">
                  {format(new Date(latestLog.check_out_time), "MMM dd, HH:mm")}
                </p>
              </div>
            </div>
          )}

          {totalHours > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <div>
                <p className="text-xs">Hours</p>
                <p className="font-medium text-foreground">{formatWorkDuration(totalHours)}</p>
              </div>
            </div>
          )}

          {isCompany && payment > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-3.5 w-3.5 text-green-600">BHD</div>
              <div>
                <p className="text-xs">Payment</p>
                <p className="font-medium text-green-600">{formatBHD(payment)}</p>
              </div>
            </div>
          )}

          {promoter.phone_number && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <Phone className="h-3.5 w-3.5" />
              <p className="text-xs">{promoter.phone_number}</p>
            </div>
          )}
        </div>

        {/* Work Session History */}
        {timeLogs.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(!showHistory)}
              className="w-full h-8 text-xs"
            >
              <Timer className="h-3.5 w-3.5 mr-1" />
              {showHistory ? 'Hide' : 'Show'} Work Sessions ({timeLogs.length} session{timeLogs.length > 1 ? 's' : ''})
            </Button>

            {showHistory && (
              <div className="mt-2 space-y-2">
                {timeLogs.map((log, index) => {
                  const isMultiDay = log.check_out_time && 
                    format(new Date(log.check_in_time), "yyyy-MM-dd") !== 
                    format(new Date(log.check_out_time), "yyyy-MM-dd");
                  
                  return (
                    <div key={log.id} className="p-2 bg-accent/50 rounded-md border text-xs space-y-1">
                      <div className="flex justify-between items-center font-medium">
                        <span className="text-muted-foreground">Session {index + 1}</span>
                        <div className="flex items-center gap-1">
                          {log.total_hours && (
                            <span className="text-foreground">{formatWorkDuration(log.total_hours)}</span>
                          )}
                          {isCompany && log.check_out_time && (
                            <EditTimeLogDialog
                              timeLogId={log.id as any}
                              checkInTime={log.check_in_time}
                              checkOutTime={log.check_out_time}
                              payRate={payRate}
                              payRateType={payRateType}
                              onUpdate={() => onUpdate?.()}
                            />
                          )}
                        </div>
                      </div>
                    
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>{format(new Date(log.check_in_time), "MMM dd, HH:mm")}</span>
                      <span className="text-xs">→</span>
                      <span>
                        {log.check_out_time 
                          ? format(new Date(log.check_out_time), "MMM dd, HH:mm")
                          : <span className="text-green-500 font-medium">Active</span>
                        }
                      </span>
                    </div>

                    {isMultiDay && (
                      <p className="text-[10px] text-orange-500 font-medium">Multi-day session</p>
                    )}

                    {isCompany && log.earnings && (
                      <div className="text-green-600 font-medium pt-1">
                        {formatBHD(log.earnings)}
                      </div>
                    )}
                    </div>
                  );
                })}
                
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total Sessions:</span>
                    <span className="font-medium text-foreground">{timeLogs.length}</span>
                  </div>
                  {totalHours > 0 && (
                    <div className="flex justify-between mt-1">
                      <span>Total Hours:</span>
                      <span className="font-medium text-foreground">{formatWorkDuration(totalHours)}</span>
                    </div>
                  )}
                  {isCompany && payment > 0 && (
                    <div className="flex justify-between mt-1">
                      <span>Total Payment:</span>
                      <span className="font-medium text-green-600">{formatBHD(payment)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
