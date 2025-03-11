
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, DollarSign, Wallet } from "lucide-react";
import { Shift } from "../../shifts/ShiftCard";
import { formatBHD } from "../../shifts/utils/currencyUtils";

type DashboardStatsProps = {
  upcomingShifts: Shift[];
  nextShift: Shift | undefined;
  completedShifts: number;
  totalEarned: number;
  unpaidAmount: number;
};

export default function DashboardStats({
  upcomingShifts,
  nextShift,
  completedShifts,
  totalEarned,
  unpaidAmount
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base font-medium">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            Upcoming Shifts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingShifts.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {nextShift ? `Next: ${new Date(nextShift.date).toLocaleDateString()}` : "No upcoming shifts"}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base font-medium">
            <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedShifts}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total shifts completed
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base font-medium">
            <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
            Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBHD(totalEarned)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total earned this month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base font-medium">
            <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
            Unpaid Amount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatBHD(unpaidAmount)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Pending payment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
