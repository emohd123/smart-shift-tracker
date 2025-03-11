import { Shift } from "./ShiftCard";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  BanknoteIcon, 
  Users 
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "./utils/shiftUtils";
import { formatBHD } from "./utils/currencyUtils";

type ShiftInfoProps = {
  shift: Shift;
  isPromoter: boolean;
};

export function ShiftInfo({ shift, isPromoter }: ShiftInfoProps) {
  return (
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="flex items-center">
            <Calendar size={18} className="mr-3 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Date</div>
              <div>{formatDate(shift.date)}</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock size={18} className="mr-3 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Time</div>
              <div>{shift.startTime} - {shift.endTime}</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <MapPin size={18} className="mr-3 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              <div>{shift.location}</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <BanknoteIcon size={18} className="mr-3 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Pay Rate</div>
              <div>{formatBHD(shift.payRate)}/hr</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <Users size={18} className="mr-3 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Assigned To</div>
              <div>{isPromoter ? "You" : "John Doe"}</div>
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-medium mb-2">Description</h3>
        <p className="text-muted-foreground">
          This promotional event requires engaging with customers and distributing product samples.
          Please arrive 15 minutes before the shift starts for briefing.
        </p>
      </div>
    </CardContent>
  );
}
