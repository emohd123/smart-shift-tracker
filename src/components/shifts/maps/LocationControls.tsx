
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navigation } from "lucide-react";
import { getCurrentLocation } from "../utils/locationUtils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type LocationControlsProps = {
  radius: number;
  onRadiusChange: (radius: number) => void;
  onUseCurrentLocation: () => void;
  loading: boolean;
};

export default function LocationControls({ 
  radius, 
  onRadiusChange, 
  onUseCurrentLocation,
  loading
}: LocationControlsProps) {
  const { toast } = useToast();
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const handleUseCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      const coords = await getCurrentLocation();
      const newLocation = { lat: coords.latitude, lng: coords.longitude };
      onUseCurrentLocation();
    } catch (error) {
      console.error("Error getting current location:", error);
      toast({
        title: "Location Error",
        description: "Could not access your current location. Please check your browser permissions.",
        variant: "destructive"
      });
    } finally {
      setFetchingLocation(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <Button 
        type="button" 
        variant="outline" 
        size="sm"
        onClick={handleUseCurrentLocation}
        disabled={loading || fetchingLocation}
        className="flex items-center gap-1"
      >
        <Navigation size={16} />
        {fetchingLocation ? "Detecting..." : "Use My Location"}
      </Button>
      
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-muted-foreground">Radius:</span>
        <Input
          type="number"
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-20 text-right"
          min={50}
          max={1000}
        />
        <span className="text-sm text-muted-foreground">m</span>
      </div>
    </div>
  );
}
