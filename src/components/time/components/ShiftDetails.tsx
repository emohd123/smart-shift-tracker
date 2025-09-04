
import { Shift } from "@/components/shifts/types/ShiftTypes";
import { Calendar, Clock, MapPin, BanknoteIcon } from "lucide-react";
import { formatBHD } from "../../shifts/utils/currencyUtils";

type ShiftDetailsProps = {
  shift: Shift;
};

export default function ShiftDetails({ shift }: ShiftDetailsProps) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center text-muted-foreground">
        <Calendar size={14} className="mr-2" />
        <span>{new Date(shift.date).toLocaleDateString()}</span>
      </div>
      
      <div className="flex items-center text-muted-foreground">
        <Clock size={14} className="mr-2" />
        <span>{shift.startTime} - {shift.endTime}</span>
      </div>
      
      <div className="flex items-center text-muted-foreground">
        <MapPin size={14} className="mr-2" />
        <span className="truncate">{shift.location}</span>
      </div>
      
      <div className="flex items-center text-muted-foreground">
        <BanknoteIcon size={14} className="mr-2" />
        <span>{formatBHD(shift.payRate)}/hr</span>
      </div>
    </div>
  );
}
