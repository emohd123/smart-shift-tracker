
import { Shift } from "./types/ShiftTypes";
import ShiftDetail from "./ShiftDetail";
import { AssignedPromotersManager } from "./assignedPromoters/AssignedPromotersManager";
import { ShiftStatusToggle } from "./status/ShiftStatusToggle";
import { ShiftContractEditor } from "./contract/ShiftContractEditor";
import { PromoterShiftStatus } from "./PromoterShiftStatus";
import { ShiftApprovalManager } from "./approval/ShiftApprovalManager";
import { cn } from "@/lib/utils";
import { ShiftStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isCompanyLike } from "@/utils/roleUtils";

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
  const isCompany = isCompanyLike(userRole);
  const isPromoter = userRole === "promoter";
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
      
      {/* Promoter monitoring view - shows status, earnings, and history */}
      {isPromoter && (
        <PromoterShiftStatus shift={shift} shiftId={shift.id} />
      )}
      
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
          
          <ShiftContractEditor 
            shiftId={shift.id} 
            companyId={shift.companyId || ""} 
            shift={shift}
            onUpdate={onUpdate}
          />
        </>
      )}
      
      {/* Only show AssignedPromotersManager for companies - promoters have their own status view */}
      {isCompany && (
        <>
          <AssignedPromotersManager
            shiftId={shift.id}
            payRate={shift.payRate}
            payRateType={shift.payRateType || "hourly"}
            userRole={userRole}
            shiftStartTime={shift.startTime}
            shiftEndTime={shift.endTime}
            shiftStatus={shift.status}
          />
          
          {/* Show approval manager for completed shifts or shifts that should be completed */}
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const shiftEndDate = shift.endDate ? new Date(shift.endDate) : new Date(shift.date);
            shiftEndDate.setHours(23, 59, 59, 999);
            const shouldBeCompleted = shiftEndDate < today;
            const isCompleted = shift.status === ShiftStatus.Completed;
            
            return (isCompleted || shouldBeCompleted) && (
              <ShiftApprovalManager
                shiftId={shift.id}
                companyId={shift.companyId}
                onApprovalChange={onUpdate}
              />
            );
          })()}
        </>
      )}
    </div>
  );
};
