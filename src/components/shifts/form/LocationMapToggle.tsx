
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import MapSelector from "../MapSelector";
import { toast } from "sonner";
import { useState } from "react";
import { Collapse } from "@/components/ui/collapse";

interface LocationMapToggleProps {
  shiftId?: string;
}

export default function LocationMapToggle({ shiftId = "new" }: LocationMapToggleProps) {
  const [showMap, setShowMap] = useState(false);
  
  const handleToggleMap = () => {
    setShowMap(prev => !prev);
  };
  
  const handleLocationSaved = () => {
    toast.success("Location Saved", {
      description: "Precise location has been saved for this shift"
    });
  };
  
  return (
    <div className="pt-2 space-y-4">
      <Button 
        type="button" 
        variant="outline" 
        className="w-full flex items-center transition-all duration-300 hover:bg-primary/10"
        onClick={handleToggleMap}
      >
        <MapPin className="mr-2 h-4 w-4" />
        {showMap ? "Hide Location Map" : "Set Precise Location"}
      </Button>
      
      <Collapse open={showMap}>
        <div className="rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <MapSelector 
            shiftId={shiftId}
            onSave={handleLocationSaved}
          />
        </div>
      </Collapse>
    </div>
  );
}
