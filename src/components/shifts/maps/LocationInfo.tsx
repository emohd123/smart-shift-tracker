
import { MapPin } from "lucide-react";

type LocationInfoProps = {
  location: { lat: number; lng: number } | null;
  radius: number;
};

export default function LocationInfo({ location, radius }: LocationInfoProps) {
  return (
    <div className="text-sm text-muted-foreground mt-2">
      <p className="flex items-center">
        <MapPin size={14} className="mr-1 text-primary" />
        {location ? (
          <span>Selected: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
        ) : (
          <span>Click on the map to select a location</span>
        )}
      </p>
      <p className="text-xs mt-1">
        Promoters will only be able to check in when they're within {radius} meters of this location.
      </p>
    </div>
  );
}
