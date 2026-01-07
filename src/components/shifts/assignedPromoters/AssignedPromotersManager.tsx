
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssignedPromoters } from "./hooks/useAssignedPromoters";
import { usePromoterTimeLogs } from "./hooks/usePromoterTimeLogs";
import { useExtraPayments } from "./hooks/useExtraPayments";
import { PromoterAttendanceCard } from "./PromoterAttendanceCard";
import { PaymentSummary } from "./PaymentSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { calculateTotalShiftPayment } from "../utils/paymentCalculations";
import { AssignPromotersDialog } from "./AssignPromotersDialog";
import { isCompanyLike } from "@/utils/roleUtils";
import { ShiftStatus } from "@/types/database";

type AssignedPromotersManagerProps = {
  shiftId: string;
  payRate: number;
  payRateType: string;
  userRole?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  shiftStatus?: ShiftStatus;
};

export const AssignedPromotersManager = ({
  shiftId,
  payRate,
  payRateType,
  userRole,
  shiftStartTime,
  shiftEndTime,
  shiftStatus,
}: AssignedPromotersManagerProps) => {
  const { promoters, loading: promotersLoading, refetch: refetchPromoters } = useAssignedPromoters(shiftId);
  const { timeLogs, loading: timeLogsLoading, refetch: refetchTimeLogs } = usePromoterTimeLogs(shiftId);
  const { totalExtraPayments, loading: extraPaymentsLoading, refetch: refetchExtraPayments } = useExtraPayments(shiftId);
  
  // Combined refetch function for when data changes
  const handleUpdate = () => {
    refetchPromoters();
    refetchTimeLogs();
    refetchExtraPayments();
  };

  const loading = promotersLoading || timeLogsLoading || extraPaymentsLoading;

  const totalCheckedIn = promoters.filter((p) => {
    const logs = timeLogs[p.promoter_id] || [];
    const latestLog = logs[logs.length - 1];
    return latestLog?.check_in_time && !latestLog?.check_out_time;
  }).length;

  const totalHours = Object.values(timeLogs).reduce((sum, logs) => {
    return sum + logs.reduce((logSum, log) => logSum + (log.total_hours || 0), 0);
  }, 0);

  const basePayment = calculateTotalShiftPayment(timeLogs, payRate, payRateType);
  const totalPayment = basePayment + totalExtraPayments;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isCompany = isCompanyLike(userRole);

  if (promoters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigned Promoters
          </CardTitle>
          <CardDescription>
            {isCompany 
              ? "Manage promoter attendance and track payments"
              : "View assigned promoters for this shift"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No promoters assigned</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isCompany 
                ? "Assign promoters to this shift to track their attendance and payments"
                : "No promoters have been assigned to this shift yet"
              }
            </p>
            {isCompany && (
              <AssignPromotersDialog 
                shiftId={shiftId}
                shiftStartTime={shiftStartTime}
                shiftEndTime={shiftEndTime}
                onSuccess={handleUpdate}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned Promoters ({promoters.length})
            </CardTitle>
            <CardDescription>
              {isCompany 
                ? "Track attendance and calculate payments in real-time"
                : "View assigned promoters and attendance status"
              }
            </CardDescription>
          </div>
          {isCompany && (
            <AssignPromotersDialog 
              shiftId={shiftId} 
              currentAssignments={promoters.map(p => p.promoter_id)}
              variant="outline"
              buttonText="Add More"
              shiftStartTime={shiftStartTime}
              shiftEndTime={shiftEndTime}
              onSuccess={handleUpdate}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <PaymentSummary
          totalPromoters={promoters.length}
          totalCheckedIn={totalCheckedIn}
          totalPayment={totalPayment}
          totalHours={totalHours}
          userRole={userRole}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoters.map((promoter) => (
            <PromoterAttendanceCard
              key={promoter.id}
              promoter={promoter}
              timeLogs={timeLogs[promoter.promoter_id] || []}
              payRate={payRate}
              payRateType={payRateType}
              shiftId={shiftId}
              userRole={userRole}
              shiftStatus={shiftStatus}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
