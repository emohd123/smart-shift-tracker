
import { Card } from "@/components/ui/card";
import { MapPin, Clock, Calendar, BanknoteIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBHD } from "./utils/currencyUtils";
import { ShiftStatus } from "@/types/database";

export type Shift = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: ShiftStatus;
  payRate: number;
  isPaid?: boolean;
};

type ShiftCardProps = {
  shift: Shift;
  onClick?: () => void;
};

export default function ShiftCard({ shift, onClick }: ShiftCardProps) {
  // Format date to display in a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status color based on shift status
  const getStatusColor = (status: ShiftStatus) => {
    switch (status) {
      case ShiftStatus.Upcoming:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case ShiftStatus.Ongoing:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case ShiftStatus.Completed:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      case ShiftStatus.Cancelled:
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card 
      className={cn(
        "p-4 hover-scale button-press cursor-pointer overflow-hidden relative",
        "border border-border/50 hover:border-border/80",
        "transition-all duration-300 ease-in-out"
      )}
      onClick={onClick}
      aria-label={`Shift: ${shift.title} on ${formatDate(shift.date)}`}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Status indicator */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium truncate pr-2">{shift.title}</h3>
        <Badge className={cn("capitalize", getStatusColor(shift.status))}>
          {shift.status}
        </Badge>
      </div>
      
      {/* Shift details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center text-muted-foreground">
          <Calendar size={14} className="mr-2 flex-shrink-0" aria-hidden="true" />
          <span>{formatDate(shift.date)}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <Clock size={14} className="mr-2 flex-shrink-0" aria-hidden="true" />
          <span>
            {shift.startTime} - {shift.endTime}
          </span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <MapPin size={14} className="mr-2 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{shift.location}</span>
        </div>
        
        <div className="flex items-center text-muted-foreground">
          <BanknoteIcon size={14} className="mr-2 flex-shrink-0" aria-hidden="true" />
          <span>{formatBHD(shift.payRate)}/hr</span>
        </div>
      </div>
    </Card>
  );
}
