
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { TimeLog, calculatePromoterPayment, formatWorkDuration, formatBHD } from "../utils/paymentCalculations";
import { Clock, Phone, User, X, LogIn, LogOut, Timer, Star, FileText, CheckCircle, Plus, Gift, Briefcase, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { useUnassignPromoter } from "./hooks/useUnassignPromoter";
import { useCompanyCheckIn } from "./hooks/useCompanyCheckIn";
import { EditAssignmentDialog } from "./EditAssignmentDialog";
import { EditTimeLogDialog } from "./EditTimeLogDialog";
import { ManualCheckInDialog } from "./ManualCheckInDialog";
import { ManualCheckOutDialog } from "./ManualCheckOutDialog";
import { PromoterWorkHistory } from "./PromoterWorkHistory";
import { AddExtraPaymentDialog } from "./AddExtraPaymentDialog";
import { PaymentProcessingDialog } from "./PaymentProcessingDialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { isCompanyLike } from "@/utils/roleUtils";
import { ShiftStatus } from "@/types/database";
import { RatingModal } from "@/components/ratings/RatingModal";
import { RatingDisplay } from "@/components/ratings/RatingDisplay";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  shiftStatus?: ShiftStatus;
};

export const PromoterAttendanceCard = ({
  promoter,
  timeLogs,
  payRate,
  payRateType,
  shiftId,
  onUpdate,
  userRole,
  shiftStatus,
}: PromoterAttendanceCardProps) => {
  const { user } = useAuth();
  const { unassignPromoter, loading: unassigning } = useUnassignPromoter();
  const { checkIn, checkOut, manualCheckIn, manualCheckOut, loading: checkInOutLoading } = useCompanyCheckIn(shiftId, payRate, payRateType);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedEarnings, setEstimatedEarnings] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const isCompany = isCompanyLike(userRole);

  // Rating state
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(true);
  
  // Contract acceptance state
  const [contractStatus, setContractStatus] = useState<'pending' | 'accepted' | 'rejected' | null>(null);
  const [contractSignatureImage, setContractSignatureImage] = useState<string | null>(null);
  const [contractHtml, setContractHtml] = useState<string | null>(null);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [contractLoading, setContractLoading] = useState(true);
  
  // Extra payments state
  const [extraPayments, setExtraPayments] = useState<Array<{
    id: string;
    amount: number;
    type: 'bonus' | 'overtime' | 'extra_task';
    description: string | null;
    created_at: string;
  }>>([]);
  const [showExtraPayments, setShowExtraPayments] = useState(false);
  
  // Payment processing state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [promoterBankDetails, setPromoterBankDetails] = useState<{
    ibanNumber?: string;
    bankName?: string;
    bankAccountHolderName?: string;
  } | null>(null);
  const [shiftTitle, setShiftTitle] = useState<string>('');

  // Calculated values (after all state declarations)
  const hasTimeLogs = timeLogs.length > 0;
  const totalHours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
  const basePayment = calculatePromoterPayment(timeLogs, payRate, payRateType);
  const totalExtraPayment = extraPayments.reduce((sum, ep) => sum + (ep.amount || 0), 0);
  const payment = basePayment + totalExtraPayment;
  const latestLog = timeLogs.length > 0 ? timeLogs[timeLogs.length - 1] : null;
  const isCheckedIn = latestLog && !latestLog.check_out_time;
  
  // Check if payment can be processed
  const hasCompletedTimeLogs = timeLogs.some(log => log.check_out_time !== null);
  const canProcessPayment = isCompany && 
    hasCompletedTimeLogs && 
    payment > 0 &&
    (promoter.payment_status === 'scheduled' || promoter.payment_status === null || promoter.payment_status === 'pending') &&
    shiftStatus !== 'cancelled';

  const isShiftCompleted = shiftStatus === ShiftStatus.Completed;
  const canRate = isCompany && isShiftCompleted && existingRating === null;

  // Fetch existing rating
  useEffect(() => {
    const fetchExistingRating = async () => {
      if (!promoter.id) {
        setRatingLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("shift_ratings")
          .select("rating")
          .eq("shift_assignment_id", promoter.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching rating:", error);
        }

        setExistingRating(data?.rating ?? null);
      } catch (err) {
        console.error("Error fetching rating:", err);
      } finally {
        setRatingLoading(false);
      }
    };

    fetchExistingRating();
  }, [promoter.id]);

  // Fetch contract acceptance status and signature
  useEffect(() => {
    const fetchContractAcceptance = async () => {
      if (!promoter.id || !promoter.promoter_id) {
        setContractLoading(false);
        return;
      }

      try {
        setContractLoading(true);
        const { data: acceptance, error } = await (supabase as any)
          .from('company_contract_acceptances')
          .select('status, signature_image, signature_text, accepted_at, shift_id')
          .eq('shift_assignment_id', promoter.id)
          .eq('promoter_id', promoter.promoter_id)
          .is('superseded_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching contract acceptance:', error);
        }

        if (acceptance) {
          setContractStatus(acceptance.status);
          setContractSignatureImage(acceptance.signature_image);
          
          // Fetch contract HTML if accepted
          if (acceptance.status === 'accepted' && acceptance.shift_id) {
            try {
              const { data: shiftData } = await supabase
                .from('shifts')
                .select('*, company_id')
                .eq('id', acceptance.shift_id)
                .single();

              if (shiftData) {
                // Fetch company name
                const { data: companyProfile } = await supabase
                  .from('company_profiles')
                  .select('name')
                  .eq('user_id', shiftData.company_id)
                  .single();

                const companyName = companyProfile?.name || 'Company';

                // Generate contract HTML (similar to PromoterContracts.tsx)
                const { generateContractTemplate } = await import('@/components/shifts/form/utils/contractTemplateGenerator');
                const { parseLocalDate } = await import('@/utils/dateUtils');

                const startDate = shiftData.date ? parseLocalDate(shiftData.date) : new Date();
                const endDate = shiftData.end_date ? parseLocalDate(shiftData.end_date) : startDate;
                const paymentDate = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000);

                // Calculate hours per day
                const [startHour, startMin] = (shiftData.start_time || '09:00').split(':').map(Number);
                const [endHour, endMin] = (shiftData.end_time || '17:00').split(':').map(Number);
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                const hoursPerDay = (endMinutes - startMinutes) / 60;
                const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                const payRateType = shiftData.pay_rate_type || 'hourly';
                let totalPay = 0;
                if (payRateType === 'hourly') {
                  totalPay = (shiftData.pay_rate || 0) * hoursPerDay * daysDiff;
                } else if (payRateType === 'daily') {
                  totalPay = (shiftData.pay_rate || 0) * daysDiff;
                } else if (payRateType === 'fixed') {
                  totalPay = shiftData.pay_rate || 0;
                }

                const contractHtml = generateContractTemplate({
                  shiftTitle: shiftData.title || 'Shift Contract',
                  description: shiftData.description || '',
                  location: shiftData.location || '',
                  startDate,
                  endDate,
                  startTime: shiftData.start_time || '09:00',
                  endTime: shiftData.end_time || '17:00',
                  payRate: shiftData.pay_rate || 0,
                  payRateType: payRateType as 'hourly' | 'daily' | 'fixed',
                  paymentDate,
                  promoterCount: 1,
                  totalEstimatedPay: totalPay,
                  promoterName: promoter.full_name,
                  promoterId: promoter.promoter_id,
                  promoterUniqueCode: promoter.unique_code,
                  companyName,
                  companyId: shiftData.company_id
                });

                // Add signature image to contract HTML if available
                if (acceptance.signature_image) {
                  const signatureSection = `
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #333;">
                      <h3 style="text-align: center; margin-bottom: 20px; color: #0066cc;">Promoter Signature</h3>
                      <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${acceptance.signature_image}" alt="Promoter Signature" style="max-width: 400px; border: 1px solid #ddd; padding: 10px; background: white;" />
                      </div>
                      ${acceptance.signature_text ? `<p style="text-align: center; color: #666;">Signed by: ${acceptance.signature_text}</p>` : ''}
                      ${acceptance.accepted_at ? `<p style="text-align: center; color: #666; font-size: 12px;">Signed on: ${new Date(acceptance.accepted_at).toLocaleString()}</p>` : ''}
                    </div>
                  `;
                  setContractHtml(contractHtml.replace('</body>', signatureSection + '</body>'));
                } else {
                  setContractHtml(contractHtml);
                }
              }
            } catch (err) {
              console.error('Error generating contract HTML:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching contract acceptance:', err);
      } finally {
        setContractLoading(false);
      }
    };

    fetchContractAcceptance();
  }, [promoter.id, promoter.promoter_id, promoter.full_name, promoter.unique_code]);


  // Fetch extra payments
  const fetchExtraPayments = async () => {
    if (!promoter.id) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('extra_payments')
        .select('id, amount, type, description, created_at')
        .eq('shift_assignment_id', promoter.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching extra payments:', error);
        return;
      }
      
      setExtraPayments(data || []);
    } catch (err) {
      console.error('Error fetching extra payments:', err);
    }
  };

  useEffect(() => {
    fetchExtraPayments();
  }, [promoter.id]);

  // Fetch shift title and promoter bank details when payment dialog opens
  useEffect(() => {
    if (showPaymentDialog && isCompany) {
      const fetchPaymentData = async () => {
        try {
          // Fetch shift title
          const { data: shiftData } = await supabase
            .from('shifts')
            .select('title')
            .eq('id', shiftId)
            .single();
          
          if (shiftData) {
            setShiftTitle(shiftData.title || 'Shift');
          }

          // Fetch promoter bank details
          const { data: promoterProfile } = await supabase
            .from('profiles')
            .select('iban_number, bank_name, bank_account_holder_name')
            .eq('id', promoter.promoter_id)
            .single();

          if (promoterProfile) {
            setPromoterBankDetails({
              ibanNumber: promoterProfile.iban_number || undefined,
              bankName: promoterProfile.bank_name || undefined,
              bankAccountHolderName: promoterProfile.bank_account_holder_name || undefined
            });
          }
        } catch (error) {
          console.error('Error fetching payment data:', error);
        }
      };

      fetchPaymentData();
    }
  }, [showPaymentDialog, isCompany, shiftId, promoter.promoter_id]);

  // Fetch shift title and promoter bank details when payment dialog opens
  useEffect(() => {
    if (showPaymentDialog && isCompany) {
      const fetchPaymentData = async () => {
        try {
          // Fetch shift title
          const { data: shiftData } = await supabase
            .from('shifts')
            .select('title')
            .eq('id', shiftId)
            .single();
          
          if (shiftData) {
            setShiftTitle(shiftData.title || 'Shift');
          }

          // Fetch promoter bank details
          const { data: promoterProfile } = await supabase
            .from('profiles')
            .select('iban_number, bank_name, bank_account_holder_name')
            .eq('id', promoter.promoter_id)
            .single();

          if (promoterProfile) {
            setPromoterBankDetails({
              ibanNumber: promoterProfile.iban_number || undefined,
              bankName: promoterProfile.bank_name || undefined,
              bankAccountHolderName: promoterProfile.bank_account_holder_name || undefined
            });
          }
        } catch (error) {
          console.error('Error fetching payment data:', error);
        }
      };

      fetchPaymentData();
    }
  }, [showPaymentDialog, isCompany, shiftId, promoter.promoter_id]);


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

  const handleCheckOut = async (customTime?: Date) => {
    if (!latestLog?.check_in_time) return;
    
    let success: boolean;
    if (customTime) {
      success = await manualCheckOut(latestLog.id as any, promoter.full_name, latestLog.check_in_time, customTime);
    } else {
      success = await checkOut(latestLog.id as any, promoter.full_name, latestLog.check_in_time);
    }
    
    if (success) {
      onUpdate?.();
    }
  };

  const handleManualCheckIn = async (customTime?: Date) => {
    // Check if contract acceptance is required for this specific shift assignment
    try {
      if (!promoter.id) {
        toast.error("Shift assignment ID is missing");
        return;
      }

      // Check if contract is accepted for this specific shift assignment (not superseded)
      const { data: acceptance, error: acceptanceError } = await (supabase as any)
        .from('company_contract_acceptances')
        .select('id, status, superseded_at')
        .eq('shift_assignment_id', promoter.id)
        .eq('promoter_id', promoter.promoter_id)
        .is('superseded_at', null) // Only check non-superseded acceptances
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Check if there's a pending contract (new version requiring approval)
      if (acceptance?.status === 'pending') {
        toast.error(`${promoter.full_name} must approve the updated contract before starting work`);
        return;
      }

      if (acceptanceError) {
        console.error('Error checking contract acceptance:', acceptanceError);
        // Don't block check-in if there's an error checking
      } else if (!acceptance || acceptance.status !== 'accepted') {
        // Check if company has an active contract template
        const { data: shift } = await supabase
          .from('shifts')
          .select('company_id')
          .eq('id', shiftId)
          .single();

        if (shift?.company_id) {
          const { data: hasTemplate } = await supabase
            .rpc('has_active_contract_template', { _company_id: shift.company_id });

          if (hasTemplate) {
            toast.error(`${promoter.full_name} must accept the company contract before starting work`);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking contract:', error);
      // Don't block check-in if there's an error checking
    }

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
      <CardContent className="p-3 space-y-3">
        {/* Header Section - Avatar, Name, Code, Phone + Status Badges + Remove */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(promoter.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{promoter.full_name}</h4>
                <p className="text-xs text-muted-foreground">Code: {promoter.unique_code}</p>
                {promoter.phone_number && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" />
                    {promoter.phone_number}
                  </p>
                )}
              </div>
              {isCompany && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      disabled={unassigning}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unassign Promoter</AlertDialogTitle>
                      <AlertDialogDescription>
                        {hasTimeLogs ? (
                          <>Cannot unassign <strong>{promoter.full_name}</strong> because they have attendance records.</>
                        ) : (
                          <>Are you sure you want to unassign <strong>{promoter.full_name}</strong>?</>
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
            {/* Status Badges Row */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              <AttendanceStatusBadge timeLogs={timeLogs} />
              {contractStatus === 'accepted' && (
                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0">
                  <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                  Contract
                </Badge>
              )}
              {contractStatus === 'pending' && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] px-1.5 py-0">
                  Pending
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        {promoter.scheduled_start_time && promoter.scheduled_end_time && (
          <div className="flex items-center justify-between p-2 bg-accent/30 rounded-md text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{promoter.scheduled_start_time} - {promoter.scheduled_end_time}</span>
            </div>
            <div className="flex gap-1">
              {promoter.auto_checkin_enabled && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Auto In</Badge>
              )}
              {promoter.auto_checkout_enabled && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Auto Out</Badge>
              )}
            </div>
          </div>
        )}

        {/* Active Working Status */}
        {isCheckedIn && (
          <div className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/20 rounded-md text-xs">
            <span className="text-green-600 font-medium flex items-center gap-1">
              <Timer className="h-3 w-3" />
              Working: {formatElapsedTime(elapsedTime)}
            </span>
            <span className="text-green-600 font-medium">{formatBHD(estimatedEarnings)}</span>
          </div>
        )}

        {/* Action Buttons Grid - 2x3 */}
        {isCompany && (
          <div className="grid grid-cols-2 gap-1.5">
            {contractStatus === 'accepted' && contractHtml ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setShowContractDialog(true)}
              >
                <FileText className="h-3 w-3 mr-1" />
                Contract
              </Button>
            ) : (
              <div /> /* Empty placeholder for grid alignment */
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
              compact
            />
            
            {isCheckedIn ? (
              <ManualCheckOutDialog
                onCheckOut={handleCheckOut}
                loading={checkInOutLoading}
                checkInTime={latestLog?.check_in_time || new Date().toISOString()}
                compact
              />
            ) : (
              <ManualCheckInDialog
                onCheckIn={handleManualCheckIn}
                loading={checkInOutLoading}
                compact
              />
            )}
            <PromoterWorkHistory
              promoterId={promoter.promoter_id}
              promoterName={promoter.full_name}
              compact
            />
            <AddExtraPaymentDialog
              shiftAssignmentId={promoter.id}
              promoterId={promoter.promoter_id}
              promoterName={promoter.full_name}
              shiftId={shiftId}
              onSuccess={() => {
                fetchExtraPayments();
                onUpdate?.();
              }}
              compact
            />
            {canProcessPayment && (
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => setShowPaymentDialog(true)}
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Pay
              </Button>
            )}
            {promoter.payment_status === 'paid' && (
              <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0 h-8 flex items-center">
                <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                Paid
              </Badge>
            )}
          </div>
        )}

        {/* Stats Row */}
        {(totalHours > 0 || (isCompany && payment > 0)) && (
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-xs">
            <div className="flex items-center gap-3">
              {totalHours > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{formatWorkDuration(totalHours)}</span>
                </span>
              )}
              {latestLog?.check_in_time && (
                <span className="text-muted-foreground">
                  In: {format(new Date(latestLog.check_in_time), "HH:mm")}
                </span>
              )}
              {latestLog?.check_out_time && (
                <span className="text-muted-foreground">
                  Out: {format(new Date(latestLog.check_out_time), "HH:mm")}
                </span>
              )}
            </div>
            {isCompany && payment > 0 && (
              <div className="text-right">
                <span className="font-medium text-green-600">{formatBHD(payment)}</span>
                {totalExtraPayment > 0 && (
                  <span className="text-[10px] text-muted-foreground block">
                    +{formatBHD(totalExtraPayment)} extra
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Extra Payments Section - Collapsible */}
        {isCompany && extraPayments.length > 0 && (
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowExtraPayments(!showExtraPayments)}
              className="w-full h-7 text-xs justify-between px-2"
            >
              <span className="flex items-center gap-1">
                <Gift className="h-3 w-3" />
                Extra Payments ({extraPayments.length})
              </span>
              <span className="text-green-600 font-medium">{formatBHD(totalExtraPayment)}</span>
            </Button>

            {showExtraPayments && (
              <div className="mt-2 space-y-1.5">
                {extraPayments.map((ep) => (
                  <div key={ep.id} className="flex items-center justify-between p-1.5 bg-accent/50 rounded text-[10px]">
                    <div className="flex items-center gap-2">
                      {ep.type === 'bonus' && <Gift className="h-3 w-3 text-amber-500" />}
                      {ep.type === 'overtime' && <Clock className="h-3 w-3 text-blue-500" />}
                      {ep.type === 'extra_task' && <Briefcase className="h-3 w-3 text-purple-500" />}
                      <span className="capitalize">{ep.type.replace('_', ' ')}</span>
                      {ep.description && (
                        <span className="text-muted-foreground truncate max-w-[100px]" title={ep.description}>
                          - {ep.description}
                        </span>
                      )}
                    </div>
                    <span className="text-green-600 font-medium">{formatBHD(ep.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rating Section */}
        {isCompany && isShiftCompleted && (
          <div className="pt-2 border-t">
            {existingRating !== null ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Rating:</span>
                <RatingDisplay rating={existingRating} size="sm" showValue />
              </div>
            ) : canRate && !ratingLoading ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs"
                onClick={() => setRatingModalOpen(true)}
              >
                <Star className="h-3 w-3 mr-1" />
                Rate Promoter
              </Button>
            ) : null}
          </div>
        )}

        {/* Work Sessions - Collapsible */}
        {timeLogs.length > 0 && (
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(!showHistory)}
              className="w-full h-7 text-xs justify-between px-2"
            >
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Work Sessions ({timeLogs.length})
              </span>
              <span className="text-muted-foreground">{showHistory ? '▲' : '▼'}</span>
            </Button>

            {showHistory && (
              <div className="mt-2 space-y-1.5">
                {timeLogs.map((log, index) => (
                  <div key={log.id} className="flex items-center justify-between p-1.5 bg-accent/50 rounded text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">#{index + 1}</span>
                      <span>{format(new Date(log.check_in_time), "MMM dd HH:mm")}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>
                        {log.check_out_time 
                          ? format(new Date(log.check_out_time), "HH:mm")
                          : <span className="text-green-500">Active</span>
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.total_hours && <span>{formatWorkDuration(log.total_hours)}</span>}
                      {isCompany && log.earnings && (
                        <span className="text-green-600">{formatBHD(log.earnings)}</span>
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
                ))}
                
                {/* Session Totals */}
                <div className="flex justify-between pt-1.5 border-t text-[10px] text-muted-foreground">
                  <span>Total: {timeLogs.length} sessions, {formatWorkDuration(totalHours)}</span>
                  {isCompany && payment > 0 && (
                    <span className="text-green-600 font-medium">{formatBHD(payment)}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rating Modal */}
        <RatingModal
          open={ratingModalOpen}
          onOpenChange={setRatingModalOpen}
          shiftId={shiftId}
          shiftAssignmentId={promoter.id}
          promoterId={promoter.promoter_id}
          promoterName={promoter.full_name}
          onSuccess={() => {
            setExistingRating(5);
            supabase
              .from("shift_ratings")
              .select("rating")
              .eq("shift_assignment_id", promoter.id)
              .maybeSingle()
              .then(({ data }) => {
                if (data) setExistingRating(data.rating);
              });
            onUpdate?.();
          }}
        />

        {/* Payment Processing Dialog */}
        {canProcessPayment && (
          <PaymentProcessingDialog
            open={showPaymentDialog}
            onClose={() => {
              setShowPaymentDialog(false);
              setPromoterBankDetails(null);
            }}
            assignmentId={promoter.id}
            promoterId={promoter.promoter_id}
            promoterName={promoter.full_name}
            amount={payment}
            ibanNumber={promoterBankDetails?.ibanNumber}
            bankName={promoterBankDetails?.bankName}
            bankAccountHolderName={promoterBankDetails?.bankAccountHolderName}
            shiftTitle={shiftTitle}
            onPaymentComplete={() => {
              onUpdate?.();
              setShowPaymentDialog(false);
            }}
          />
        )}

        {/* Signed Contract Dialog */}
        <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Signed Contract - {promoter.full_name}</DialogTitle>
              <DialogDescription>
                Contract signed by {promoter.full_name} ({promoter.unique_code})
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-lg overflow-hidden bg-white">
              <div className="overflow-auto max-h-[70vh]">
                {contractHtml ? (
                  <iframe
                    srcDoc={contractHtml}
                    title="Signed Contract"
                    className="w-full border-none"
                    style={{ minHeight: "600px" }}
                  />
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    {contractLoading ? 'Loading...' : 'Contract not available'}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
