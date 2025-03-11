
import { useState, useEffect } from "react";
import { Shift } from "./ShiftCard";
import { 
  Card
} from "@/components/ui/card";
import { 
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ShiftHeader } from "./ShiftHeader";
import { ShiftInfo } from "./ShiftInfo";
import { ShiftActions } from "./ShiftActions";
import MapSelector from "./MapSelector";
import { useResponsive } from "@/hooks/useResponsive";

type ShiftDetailProps = {
  shift: Shift;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  onDelete?: (id: string) => void;
};

export default function ShiftDetail({ 
  shift, 
  onCheckIn, 
  onCheckOut, 
  onDelete 
}: ShiftDetailProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile } = useResponsive();
  const [isCheckedIn, setIsCheckedIn] = useState(shift.status === "ongoing");
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const isAdmin = user?.role === "admin";
  const isPromoter = user?.role === "promoter";
  
  useEffect(() => {
    // Add animation effect on load
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleCheckIn = () => {
    setIsCheckedIn(true);
    toast({
      title: "Checked In",
      description: `You've successfully checked in to ${shift.title}`,
    });
    if (onCheckIn) onCheckIn();
  };
  
  const handleCheckOut = () => {
    setIsCheckedIn(false);
    toast({
      title: "Checked Out",
      description: `You've successfully checked out from ${shift.title}`,
    });
    if (onCheckOut) onCheckOut();
  };

  const handleDelete = (shiftId: string) => {
    if (onDelete) {
      onDelete(shiftId);
      toast({
        title: "Shift Deleted",
        description: `The shift "${shift.title}" has been deleted`,
        variant: "destructive"
      });
      navigate("/shifts");
    }
  };

  const handleSetLocation = () => {
    setShowLocationMap(!showLocationMap);
  };
  
  return (
    <div className={cn(
      "max-w-3xl mx-auto transition-all duration-500", 
      isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4 group hover:bg-primary/10" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
        Back
      </Button>
      
      <Card className="shadow-sm border-border/50 overflow-hidden">
        <ShiftHeader 
          shift={shift} 
          isAdmin={isAdmin} 
          onDelete={handleDelete} 
        />
        
        <ShiftInfo 
          shift={shift} 
          isPromoter={isPromoter} 
        />
        
        <ShiftActions 
          shift={shift}
          isPromoter={isPromoter}
          isAdmin={isAdmin}
          isCheckedIn={isCheckedIn}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onSetLocation={handleSetLocation}
        />
      </Card>
      
      {showLocationMap && isAdmin && (
        <div className="mt-6 animate-fade-in">
          <MapSelector 
            shiftId={shift.id} 
            onSave={() => setShowLocationMap(false)}
          />
        </div>
      )}
    </div>
  );
}
