
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ShiftStatus } from "@/types/database";
import { getStatusBadge, formatDate } from "./utils/shiftUtils";
import { formatBHD } from "./utils/currencyUtils";

export interface Shift {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  location: string;
  status: ShiftStatus;
  payRate: number;
  payRateType?: string;
  isPaid: boolean;
}

interface ShiftCardProps {
  shift: Shift;
  selected?: boolean;
}

const ShiftCard = ({ shift, selected = false }: ShiftCardProps) => {
  const statusBadge = getStatusBadge(shift.status);
  
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
          <div className="flex justify-between items-start">
            <h3 className="font-medium line-clamp-2">{shift.title}</h3>
            <Badge className={cn("ml-2 shrink-0", statusBadge.color)}>
              <span className="flex items-center">
                {statusBadge.icon}
                {shift.status}
              </span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 pb-2">
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <span>{getDateDisplay()}</span>
            </div>
            <div className="flex items-start">
              <Clock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <span>{shift.startTime} - {shift.endTime}</span>
            </div>
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
              <span className="line-clamp-2">{shift.location}</span>
            </div>
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
};

export default ShiftCard;
