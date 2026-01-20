
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Clock } from "lucide-react";
import { formatBHD } from "../utils/paymentCalculations";
import { isCompanyLike } from "@/utils/roleUtils";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { tooltips } from "@/config/tooltips";

type PaymentSummaryProps = {
  totalPromoters: number;
  totalCheckedIn: number;
  totalPayment: number;
  totalHours: number;
  userRole?: string;
};

export const PaymentSummary = ({
  totalPromoters,
  totalCheckedIn,
  totalPayment,
  totalHours,
  userRole,
}: PaymentSummaryProps) => {
  const isCompany = isCompanyLike(userRole);
  return (
    <div className={`grid grid-cols-1 ${isCompany ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-4 mb-6`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <HelpTooltip content={tooltips.company.shifts.assignedPromoters} />
          </div>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPromoters}</div>
          <p className="text-xs text-muted-foreground">Promoters</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium">Checked In</CardTitle>
            <HelpTooltip content="Number of promoters currently checked in and working on this shift" />
          </div>
          <div className="h-4 w-4 rounded-full bg-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCheckedIn}</div>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent>
      </Card>

      {isCompany && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <HelpTooltip content="Combined total hours worked by all promoters on this shift" />
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">Worked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">Total Payment</CardTitle>
                <HelpTooltip content={tooltips.company.shifts.paymentSummary} />
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBHD(totalPayment)}</div>
              <p className="text-xs text-muted-foreground">Labor cost</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
