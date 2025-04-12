
import { Shift } from "./types/ShiftTypes";
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
  isPromoter?: boolean;
};

export function ShiftInfo({ shift, isPromoter }: ShiftInfoProps) {
  return (
    <CardContent className="pt-2 pb-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium">Date</div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(shift.date)}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium">Time</div>
                <div className="text-sm text-muted-foreground">
                  {shift.startTime} - {shift.endTime}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium">Location</div>
                <div className="text-sm text-muted-foreground">
                  {shift.location}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <BanknoteIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium">Pay Rate</div>
                <div className="text-sm text-muted-foreground">
                  {formatBHD(shift.payRate)}/hr
                </div>
              </div>
            </div>
            
            {isPromoter && (
              <div className="flex items-start gap-2.5">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Status</div>
                  <div className="text-sm text-muted-foreground">
                    {shift.is_assigned ? "Assigned to you" : "Not assigned"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Separator />
      </div>
    </CardContent>
  );
}
