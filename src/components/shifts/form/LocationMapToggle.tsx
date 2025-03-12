
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import MapSelector from "../MapSelector";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function LocationMapToggle() {
  const { toast } = useToast();
  const [showMap, setShowMap] = useState(false);
  
  return (
    <div className="pt-2">
      <Button 
        type="button" 
        variant="outline" 
        className="w-full flex items-center"
        onClick={() => setShowMap(!showMap)}
      >
        <MapPin className="mr-2 h-4 w-4" />
        {showMap ? "Hide Location Map" : "Set Precise Location"}
      </Button>
      
      {showMap && (
        <div className="mt-4">
          <MapSelector 
            shiftId="new"
            onSave={() => {
              toast({
                title: "Location Saved",
                description: "Precise location has been saved for this shift"
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
