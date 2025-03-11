
import { useState } from "react";
import { Clock, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Shift } from "./ShiftCard";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation, isWithinRadius } from "./utils/locationUtils";
import { supabase } from "@/integrations/supabase/client";

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
  shift, 
  isPromoter,
  isAdmin,
  isCheckedIn, 
  onCheckIn, 
  onCheckOut,
  onSetLocation
}: ShiftActionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  
  const isNotActiveShift = shift.status === "completed" || shift.status === "cancelled";
  
  if (!isPromoter && !isAdmin) {
    return null;
  }
  
  const handleCheckIn = async () => {
    try {
      setLoading(true);
      setShowLocationError(false);
      
      const { data: shiftLocation, error } = await supabase
        .from('shift_locations')
        .select('*')
        .eq('shift_id', shift.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new Error("Failed to check location requirements");
      }
      
      if (!shiftLocation) {
        onCheckIn();
        return;
      }
      
      const currentCoords = await getCurrentLocation();
      
      const withinRadius = isWithinRadius(
        currentCoords.latitude,
        currentCoords.longitude,
        parseFloat(shiftLocation.latitude),
        parseFloat(shiftLocation.longitude),
        shiftLocation.radius
      );
      
      if (withinRadius) {
        onCheckIn();
        toast({
          title: "Location Verified",
          description: "Your location has been verified. You are now checked in.",
        });
      } else {
        setShowLocationError(true);
        toast({
          title: "Wrong Location",
          description: "You must be at the shift location to check in.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error during check-in:", error);
      toast({
        title: "Check-in Failed",
        description: error.message || "Please allow location access to check in.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (isAdmin) {
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
  
  return (
    <CardFooter className="flex flex-col gap-3">
      {showLocationError && (
        <div className="w-full bg-destructive/10 text-destructive rounded-md p-3 text-sm flex items-start">
          <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Wrong Location</p>
            <p className="text-xs mt-1">You must be physically present at the shift location to check in.</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-end w-full">
        {!isCheckedIn ? (
          <Button 
            onClick={handleCheckIn} 
            disabled={isNotActiveShift || loading}
          >
            <Clock size={16} className="mr-2" />
            {loading ? "Verifying Location..." : "Check In"}
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
      </div>
    </CardFooter>
  );
}
