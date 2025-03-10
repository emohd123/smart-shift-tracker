
import { useState } from "react";
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
  const [isCheckedIn, setIsCheckedIn] = useState(shift.status === "ongoing");
  
  const isAdmin = user?.role === "admin";
  const isPromoter = user?.role === "promoter";
  
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
  
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} className="mr-1" />
        Back
      </Button>
      
      <Card className="shadow-sm border-border/50">
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
          isCheckedIn={isCheckedIn}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
        />
      </Card>
    </div>
  );
}
