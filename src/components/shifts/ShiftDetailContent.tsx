
import { Shift } from "./types/ShiftTypes";
import ShiftDetail from "./ShiftDetail";
import { AssignedPromotersManager } from "./assignedPromoters/AssignedPromotersManager";
import { ShiftStatusToggle } from "./status/ShiftStatusToggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ShiftDetailContentProps = {
  shift: Shift;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  userRole?: string;
};

export const ShiftDetailContent = ({
  shift,
  onDelete,
  onUpdate,
  userRole,
}: ShiftDetailContentProps) => {
  const isCompany = userRole === "company" || userRole === "admin";
  const navigate = useNavigate();

  return (
    <div className={cn(
      "space-y-6 transition-all duration-300",
      "animate-fade-in"
    )}>
      <ShiftDetail 
        shift={shift}
        onCheckIn={() => {}}
        onCheckOut={() => {}}
        onDelete={onDelete}
      />
      
      {isCompany && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Shift Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate(`/shifts/${shift.id}/edit`)}
                variant="outline"
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Shift Details
              </Button>
            </CardContent>
          </Card>
          
          <ShiftStatusToggle shift={shift} onUpdate={onUpdate} />
        </>
      )}
      
      <AssignedPromotersManager
        shiftId={shift.id}
        payRate={shift.payRate}
        payRateType={shift.payRateType || "hourly"}
        userRole={userRole}
      />
    </div>
  );
};
