
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentLocation, isWithinRadius } from "../../shifts/utils/locationUtils";

export function useLocationVerification() {
  const { toast } = useToast();

  // Verify location for check-in
  const verifyLocation = useCallback(async (shiftId: string): Promise<boolean> => {
    if (!shiftId) return true;
    
    try {
      const { data: shiftLocation, error } = await supabase
        .from('shift_locations')
        .select('*')
        .eq('shift_id', shiftId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking location:", error);
        return false;
      }
      
      if (!shiftLocation) {
        return true;
      }
      
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
    } catch (error) {
      console.error("Location verification error:", error);
      toast({
        title: "Location Error",
        description: "Could not verify your location. Please check your location permissions.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return { verifyLocation };
}
