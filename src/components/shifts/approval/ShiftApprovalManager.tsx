import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, DollarSign, Users, AlertCircle, Timer } from "lucide-react";
import { useShiftApproval } from "./hooks/useShiftApproval";
import { usePendingApprovals, PendingApproval } from "./hooks/usePendingApprovals";
import { formatBHD } from "../utils/currencyUtils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { formatWorkDuration } from "../utils/paymentCalculations";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { tooltips } from "@/config/tooltips";

type ShiftApprovalManagerProps = {
  shiftId?: string; // If provided, only show approvals for this shift
  companyId?: string;
  onApprovalChange?: () => void;
};

export const ShiftApprovalManager = ({ 
  shiftId, 
  companyId,
  onApprovalChange 
}: ShiftApprovalManagerProps) => {
  const { pendingApprovals, totalPendingPayment, loading, refetch } = usePendingApprovals(companyId);
  const { approvePromoterWork, bulkApprovePromoters, loading: approving } = useShiftApproval();

  // Filter by shift if provided
  const filteredApprovals = shiftId 
    ? pendingApprovals.filter(a => a.shift_id === shiftId)
    : pendingApprovals;

  // Group by shift
  const approvalsByShift = filteredApprovals.reduce((acc, approval) => {
    if (!acc[approval.shift_id]) {
      acc[approval.shift_id] = [];
    }
    acc[approval.shift_id].push(approval);
    return acc;
  }, {} as Record<string, PendingApproval[]>);

  const handleApprove = async (assignmentId: string, promoterName: string, shiftId: string) => {
    const success = await approvePromoterWork(assignmentId, promoterName, shiftId);
    if (success) {
      refetch();
      onApprovalChange?.();
    }
  };

  const handleBulkApprove = async (shiftId: string, assignmentIds: string[]) => {
    const success = await bulkApprovePromoters(assignmentIds, shiftId);
    if (success) {
      refetch();
      onApprovalChange?.();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (filteredApprovals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Work Approvals
          </CardTitle>
          <CardDescription>
            All promoter work has been approved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>No pending approvals</p>
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
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Pending Work Approvals
              </CardTitle>
              <HelpTooltip content="Review and approve completed work from promoters before processing payments" />
            </div>
            <CardDescription>
              {filteredApprovals.length} promoter{filteredApprovals.length !== 1 ? 's' : ''} awaiting approval
            </CardDescription>
          </div>
          {!shiftId && (
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-600">{formatBHD(totalPendingPayment)}</p>
              <p className="text-xs text-muted-foreground">Total Pending Payment</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(approvalsByShift).map(([shiftId, approvals]) => {
          const shift = approvals[0];
          const shiftTotal = approvals.reduce((sum, a) => sum + a.total_earnings, 0);
          
          return (
            <div key={shiftId} className="border rounded-lg p-4 space-y-4">
              {/* Shift Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{shift.shift_title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(shift.shift_date), "MMM d, yyyy")}
                    {shift.shift_end_date && shift.shift_end_date !== shift.shift_date && (
                      <> - {format(new Date(shift.shift_end_date), "MMM d, yyyy")}</>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-600">{formatBHD(shiftTotal)}</p>
                  <p className="text-xs text-muted-foreground">Pending Payment</p>
                </div>
              </div>

              {/* Bulk Approve Button */}
              {approvals.length > 1 && (
                <Button
                  onClick={() => handleBulkApprove(shiftId, approvals.map(a => a.assignment_id))}
                  disabled={approving}
                  className="w-full"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve All ({approvals.length} promoters)
                </Button>
              )}

              {/* Promoters List */}
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div
                    key={approval.assignment_id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{approval.promoter_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {approval.promoter_code}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatWorkDuration(approval.total_hours)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {approval.sessions_count} session{approval.sessions_count !== 1 ? 's' : ''}
                        </div>
                        {approval.extra_payments > 0 && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <DollarSign className="h-3 w-3" />
                            +{formatBHD(approval.extra_payments)} extras
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatBHD(approval.total_earnings)}</p>
                        <p className="text-xs text-muted-foreground">Total Earnings</p>
                      </div>
                      <Button
                        onClick={() => handleApprove(
                          approval.assignment_id,
                          approval.promoter_name,
                          approval.shift_id
                        )}
                        disabled={approving}
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

