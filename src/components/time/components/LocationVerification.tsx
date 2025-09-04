
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

type LocationVerificationProps = {
  locationVerified: boolean;
  showLocationError: boolean;
};

export default function LocationVerification({ locationVerified, showLocationError }: LocationVerificationProps) {
  if (!locationVerified && !showLocationError) return null;
  
  return (
    <div className="flex items-center justify-center">
      {locationVerified && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <MapPin size={12} />
          Location Verified
        </Badge>
      )}
    </div>
  );
}
