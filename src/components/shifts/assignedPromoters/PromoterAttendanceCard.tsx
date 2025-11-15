
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AttendanceStatusBadge } from "./AttendanceStatusBadge";
import { TimeLog, calculatePromoterPayment, formatWorkDuration, formatBHD } from "../utils/paymentCalculations";
import { Clock, Phone, User, X } from "lucide-react";
import { format } from "date-fns";
import { useUnassignPromoter } from "./hooks/useUnassignPromoter";
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
  };
  timeLogs: TimeLog[];
  payRate: number;
  payRateType: string;
};

export const PromoterAttendanceCard = ({
  promoter,
  timeLogs,
  payRate,
  payRateType,
}: PromoterAttendanceCardProps) => {
  const { unassignPromoter, loading: unassigning } = useUnassignPromoter();
  const hasTimeLogs = timeLogs.length > 0;
  const totalHours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
  const payment = calculatePromoterPayment(timeLogs, payRate, payRateType);
  const latestLog = timeLogs.length > 0 ? timeLogs[timeLogs.length - 1] : null;

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
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {latestLog?.check_in_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <div>
                <p className="text-xs">Check In</p>
                <p className="font-medium text-foreground">
                  {format(new Date(latestLog.check_in_time), "HH:mm")}
                </p>
              </div>
            </div>
          )}

          {latestLog?.check_out_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <div>
                <p className="text-xs">Check Out</p>
                <p className="font-medium text-foreground">
                  {format(new Date(latestLog.check_out_time), "HH:mm")}
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

          {payment > 0 && (
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
      </CardContent>
    </Card>
  );
};
