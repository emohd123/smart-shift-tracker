
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation } from "../utils/locationUtils";
import { supabase } from "@/integrations/supabase/client";
import MapDisplay from "./MapDisplay";
import LocationControls from "./LocationControls";
import LocationInfo from "./LocationInfo";
import SaveLocation from "./SaveLocation";

interface MapSelectorProps {
  shiftId: string;
  onSave?: () => void;
}

export default function MapSelector({ shiftId, onSave }: MapSelectorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [radius, setRadius] = useState(100);

  useEffect(() => {
    const checkExistingLocation = async () => {
      try {
        setLoading(true);
        // Don't try to fetch location for a new shift
        if (shiftId === "new") {
          // Check if there's a temporary location in localStorage
          const tempLocationString = localStorage.getItem('temp_shift_location');
          if (tempLocationString) {
            const tempLocation = JSON.parse(tempLocationString);
            setLocation({ 
              lat: tempLocation.latitude, 
              lng: tempLocation.longitude 
            });
            setRadius(tempLocation.radius);
          }
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('shift_locations')
          .select('*')
          .eq('shift_id', shiftId)
          .single();
          
        if (error) {
          // Don't show error for missing location, just continue
          if (error.code === 'PGRST116') {
            setLoading(false);
            return;
          }
          console.error("Error fetching shift location:", error);
          return;
        }
        
        if (data) {
          setLocation({ 
            lat: Number(data.latitude), 
            lng: Number(data.longitude) 
          });
          setRadius(data.radius);
        }
      } catch (error) {
        console.error("Error checking existing location:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingLocation();
  }, [shiftId]);

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      const coords = await getCurrentLocation();
      const newLocation = { lat: coords.latitude, lng: coords.longitude };
      setLocation(newLocation);
    } catch (error) {
      console.error("Error getting current location:", error);
      toast({
        title: "Location Error",
        description: "Could not access your current location. Please check your browser permissions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Set Check-in Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <MapDisplay 
          location={location} 
          radius={radius} 
          onLocationChange={setLocation}
          loading={loading}
        />
        
        <LocationControls 
          radius={radius}
          onRadiusChange={setRadius}
          onUseCurrentLocation={handleUseCurrentLocation}
          loading={loading}
        />
        
        <SaveLocation 
          shiftId={shiftId}
          location={location}
          radius={radius}
          onSave={onSave}
        />
        
        <LocationInfo 
          location={location}
          radius={radius}
        />
      </CardContent>
    </Card>
  );
}
