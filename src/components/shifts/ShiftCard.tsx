
import { ShiftStatus } from "@/types/database";
import { getStatusBadge } from "./utils/shiftUtils";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export interface Shift {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: ShiftStatus;
  payRate: number;
  isPaid?: boolean;
}

interface ShiftCardProps {
  shift: Shift;
  onClick?: () => void;
}

export default function ShiftCard({ shift, onClick }: ShiftCardProps) {
  const { color, icon } = getStatusBadge(shift.status);
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all border-border/50 hover:border-primary/50 hover:shadow-md cursor-pointer",
        {
          "opacity-75": shift.status === ShiftStatus.Completed || shift.status === ShiftStatus.Cancelled
        }
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium line-clamp-2 flex-1">{shift.title}</h3>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
          <span>{new Date(shift.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
          <span>{shift.startTime} - {shift.endTime}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
          <span className="line-clamp-1">{shift.location}</span>
        </div>
        <div className="flex items-center text-sm font-medium">
          <DollarSign className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/70" />
          <span>BHD {shift.payRate.toFixed(2)}/hr</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className={cn("rounded-full px-2.5 py-0.5 text-xs flex items-center", color)}>
          {icon}
          <span>{shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}</span>
        </div>
        {shift.isPaid && (
          <div className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2 py-0.5">
            Paid
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
