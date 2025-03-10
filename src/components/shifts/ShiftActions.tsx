
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Shift } from "./ShiftCard";

type ShiftActionsProps = {
  shift: Shift;
  isPromoter: boolean;
  isCheckedIn: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
};

export function ShiftActions({ 
  shift, 
  isPromoter, 
  isCheckedIn, 
  onCheckIn, 
  onCheckOut 
}: ShiftActionsProps) {
  // Check if the status is not "upcoming" or "ongoing"
  const isNotActiveShift = shift.status === "completed" || shift.status === "cancelled";
  
  if (!isPromoter || isNotActiveShift) {
    return null;
  }
  
  return (
    <CardFooter className="flex justify-end gap-3">
      {!isCheckedIn ? (
        <Button 
          onClick={onCheckIn} 
          disabled={isNotActiveShift}
        >
          <Clock size={16} className="mr-2" />
          Check In
        </Button>
      ) : (
        <Button 
          onClick={onCheckOut}
          variant="outline"
        >
          <Clock size={16} className="mr-2" />
          Check Out
        </Button>
      )}
    </CardFooter>
  );
}
