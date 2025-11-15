
import { Shift } from "./types/ShiftTypes";
import ShiftDetail from "./ShiftDetail";
import { AssignedPromotersManager } from "./assignedPromoters/AssignedPromotersManager";
import { ShiftStatusToggle } from "./status/ShiftStatusToggle";
import { cn } from "@/lib/utils";

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
      
      <AssignedPromotersManager
        shiftId={shift.id}
        payRate={shift.payRate}
        payRateType={shift.payRateType || "hourly"}
      />

      {isCompany && (
        <ShiftStatusToggle shift={shift} onUpdate={onUpdate} />
      )}
    </div>
  );
};
