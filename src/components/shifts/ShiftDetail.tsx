
import { useState, useEffect } from "react";
import { Shift } from "./types/ShiftTypes";
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
import { isAdminLike } from "@/utils/roleUtils";
import { useToast } from "@/hooks/use-toast";
import { ShiftHeader } from "./ShiftHeader";
import { ShiftInfo } from "./ShiftInfo";
import { ShiftActions } from "./ShiftActions";
import MapSelector from "./MapSelector";
import { useResponsive } from "@/hooks/useResponsive";
import { getEffectiveStatus } from "./utils/statusCalculations";

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
  const [isCheckedIn, setIsCheckedIn] = useState(getEffectiveStatus(shift) === "ongoing");
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Leverage the role stored in user object which is protected by RLS
  const isAdmin = isAdminLike(user?.role);
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

  const handleDelete = async (shiftId: string) => {


    try {
      if (onDelete) {
        await onDelete(shiftId);
        toast({
          title: "Shift Deleted",
          description: `The shift "${shift.title}" has been deleted`,
          variant: "destructive"
        });
        navigate("/shifts");
      } else if (window.deleteShift) {
        // Fallback to the global deleteShift function if available
        window.deleteShift(shiftId);
        toast({
          title: "Shift Deleted",
          description: `The shift "${shift.title}" has been deleted`,
          variant: "destructive"
        });
        navigate("/shifts");
      } else {
        toast({
          title: "Error",
          description: "Unable to delete shift - delete function not available",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Error",
        description: "Failed to delete shift. Please try again.",
        variant: "destructive"
      });
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
};
