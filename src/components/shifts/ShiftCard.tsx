
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, DollarSign, Building2, Users, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getStatusBadge, formatDate } from "./utils/shiftUtils";
import { formatBHD } from "./utils/currencyUtils";
import { Shift } from "./types/ShiftTypes";
import { getEffectiveStatus } from "./utils/statusCalculations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ShiftCardProps {
  shift: Shift;
  selected?: boolean;
}

export default function ShiftCard({ shift, selected = false }: ShiftCardProps) {
  const effectiveStatus = getEffectiveStatus(shift);
  const statusBadge = getStatusBadge(effectiveStatus);
  
  // Create a formatted rate display
  const getRateDisplayText = () => {
    switch (shift.payRateType) {
      case "day":
        return `${formatBHD(shift.payRate)}/day`;
      case "month":
        return `${formatBHD(shift.payRate)}/month`;
      default:
        return `${formatBHD(shift.payRate)}/hr`;
    }
  };
  
  // Display date range if end date exists
  const getDateDisplay = () => {
    if (shift.endDate && shift.endDate !== shift.date) {
      return `${formatDate(shift.date)} - ${formatDate(shift.endDate)}`;
    }
    return formatDate(shift.date);
  };
  
  return (
    <Link to={`/shifts/${shift.id}`} className="block h-full">
      <Card className={cn(
        "h-full transition-all hover:shadow-md",
        selected && "ring-2 ring-primary/50 shadow-md"
      )}>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-2">{shift.title}</h3>
              {shift.companyName && (
                <div className="flex items-center gap-2 mt-1">
                  {shift.companyLogoUrl ? (
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={shift.companyLogoUrl} />
                      <AvatarFallback className="text-[8px]">
                        {shift.companyName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {shift.companyName}
                  </span>
                </div>
              )}
            </div>
            <Badge className={cn("ml-2 shrink-0", statusBadge.color)}>
              <span className="flex items-center">
                {statusBadge.icon}
                {effectiveStatus}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 pb-2">
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
              <span>{getDateDisplay()}</span>
            </div>
            <div className="flex items-start">
              <Clock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
              <span>{shift.startTime} - {shift.endTime}</span>
            </div>
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground shrink-0" />
              <span className="line-clamp-2">{shift.location}</span>
            </div>
            {(shift.promoterCount !== undefined && shift.promoterCount > 0) && (
              <div className="flex items-center gap-2 pt-1">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs">
                  {shift.promoterCount} Promoter{shift.promoterCount !== 1 ? 's' : ''}
                  {getEffectiveStatus(shift) === 'ongoing' && shift.activePromoterCount !== undefined && shift.activePromoterCount > 0 && (
                    <span className="text-green-600 dark:text-green-400 ml-1">
                      ({shift.activePromoterCount} active)
                    </span>
                  )}
                </span>
              </div>
            )}
            {getEffectiveStatus(shift) === 'completed' && shift.totalHours !== undefined && shift.totalHours > 0 && (
              <div className="flex items-center gap-2 pt-1 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{shift.totalHours.toFixed(1)}h worked</span>
                </div>
                {shift.totalEarnings !== undefined && shift.totalEarnings > 0 && (
                  <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatBHD(shift.totalEarnings)}</span>
                  </div>
                )}
                {shift.workApproved && (
                  <Badge variant="outline" className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-2 border-t">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="font-medium">{getRateDisplayText()}</span>
            </div>
            {shift.isPaid && (
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Paid
              </Badge>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
