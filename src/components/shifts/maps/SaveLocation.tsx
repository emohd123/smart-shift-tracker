
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
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
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSaveLocation = async () => {
    if (!location) {
      toast.error("Location Required", {
        description: "Please select a location on the map before saving."
      });
      return;
    }
    
    try {
      setSaveLoading(true);
      
      if (shiftId === "new") {
        // For new shifts, we'll store the location in localStorage temporarily
        const tempLocation = {
          latitude: location.lat,
          longitude: location.lng,
          radius: radius,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('temp_shift_location', JSON.stringify(tempLocation));
        
        if (onSave) onSave();
        
        toast.success("Location Saved", {
          description: "The location will be associated with your shift when you submit the form."
        });
        
        setSaveLoading(false);
        return;
      }
      
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
      
      toast.success("Location Saved", {
        description: "The check-in location has been set successfully."
      });
      
      if (onSave) onSave();
    } catch (error: any) {
      console.error("Error saving location:", error);
      toast.error("Save Error", {
        description: error.message || "Could not save the location. Please try again."
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
