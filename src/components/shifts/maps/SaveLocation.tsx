import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type SaveLocationProps = {
  shiftId: string;
  location: { lat: number; lng: number } | null;
  radius: number;
  onSave?: () => void;
};

export default function SaveLocation({ 
  shiftId, 
  location, 
  radius,
  onSave 
}: SaveLocationProps) {
  const { toast } = useToast();
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSaveLocation = async () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please select a location on the map before saving.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaveLoading(true);
      
      const { data: existingLocation } = await supabase
        .from('shift_locations')
        .select('id')
        .eq('shift_id', shiftId)
        .single();
      
      let result;
      
      if (existingLocation) {
        result = await supabase
          .from('shift_locations')
          .update({
            latitude: location.lat,
            longitude: location.lng,
            radius: radius
          })
          .eq('id', existingLocation.id);
      } else {
        result = await supabase
          .from('shift_locations')
          .insert({
            shift_id: shiftId,
            latitude: location.lat,
            longitude: location.lng,
            radius: radius
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Location Saved",
        description: "The check-in location has been set successfully.",
      });
      
      if (onSave) onSave();
    } catch (error: any) {
      console.error("Error saving location:", error);
      toast({
        title: "Save Error",
        description: error.message || "Could not save the location. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSaveLocation}
      disabled={!location || saveLoading}
      className="w-full mt-3"
    >
      {saveLoading ? "Saving..." : (
        <>
          <Save size={16} className="mr-2" />
          Save Location
        </>
      )}
    </Button>
  );
}
