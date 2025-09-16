
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SaveLocationProps {
  shiftId: string;
  location: { lat: number; lng: number } | null;
  radius: number;
  onSave?: () => void;
}

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
        
        toast.success("Location Saved", {
          description: "The location will be associated with your shift when you submit the form."
        });
        
        if (onSave) onSave();
        setSaveLoading(false);
        return;
      }
      
      // For existing shifts, save to database
      await saveLocationToDatabase(shiftId, location, radius);
      
      toast.success("Location Saved", {
        description: "The check-in location has been set successfully."
      });
      
      if (onSave) onSave();
    } catch (error: unknown) {
      console.error("Error saving location:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not save the location. Please try again.";
      toast.error("Save Error", {
        description: errorMessage
      });
    } finally {
      setSaveLoading(false);
    }
  };
  
  const saveLocationToDatabase = async (
    shiftId: string, 
    location: { lat: number; lng: number }, 
    radius: number
  ) => {
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
    
    return result;
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
