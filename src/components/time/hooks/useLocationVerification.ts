
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation, isWithinRadius } from "../../shifts/utils/locationUtils";

export function useLocationVerification() {
  const { toast } = useToast();
  const [permissionError, setPermissionError] = useState<boolean>(false);

  // Verify location for check-in
  const verifyLocation = useCallback(async (shiftId: string): Promise<boolean | null> => {
    if (!shiftId) return true;
    setPermissionError(false);
    
    try {
      const { data: shiftLocation, error } = await supabase
        .from('shift_locations')
        .select('*')
        .eq('shift_id', shiftId)
        .maybeSingle();
      
      if (error) {
        console.error("Error checking location:", error);
        toast({
          title: "Error",
          description: "Could not verify location requirements. Please try again.",
          variant: "destructive"
        });
        return false;
      }
      
      if (!shiftLocation) {
        // No location requirement for this shift
        return true;
      }
      
      try {
        const coords = await getCurrentLocation();
        
        const within = isWithinRadius(
          coords.latitude,
          coords.longitude,
          Number(shiftLocation.latitude),
          Number(shiftLocation.longitude),
          shiftLocation.radius
        );
        
        if (!within) {
          toast({
            title: "Wrong Location",
            description: "You must be at the shift location to start tracking time.",
            variant: "destructive"
          });
          return false;
        }
        
        return true;
      } catch (error: any) {
        if (error.code === 1) { // Permission denied
          setPermissionError(true);
          toast({
            title: "Location Permission Denied",
            description: "Please enable location access in your browser settings.",
            variant: "destructive"
          });
          return null; // Special case for permission denied
        }
        
        console.error("Location access error:", error);
        toast({
          title: "Location Error",
          description: "Could not access your location. Please check your device settings.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Location verification error:", error);
      toast({
        title: "Location Error",
        description: "Could not verify your location. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return { verifyLocation, permissionError };
}
