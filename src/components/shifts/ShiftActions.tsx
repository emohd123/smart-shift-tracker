
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Shift } from "./types/ShiftTypes";

type ShiftActionsProps = {
  shift: Shift;
  isPromoter: boolean;
  isAdmin: boolean;
  isCheckedIn: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onSetLocation?: () => void;
};

export function ShiftActions({ 
  isAdmin,
  onSetLocation
}: ShiftActionsProps) {
  // Only admins/companies can see the Set Check-in Location button
  // Promoters now have a separate monitoring view (PromoterShiftStatus)
  if (!isAdmin) {
    return null;
  }
  
  // Admin-specific view - Set Check-in Location
  return (
    <CardFooter className="flex justify-end gap-3">
      <Button 
        onClick={onSetLocation} 
        variant="outline"
      >
        <MapPin size={16} className="mr-2" />
        Set Check-in Location
      </Button>
    </CardFooter>
  );
}
