
import React from "react";
import { Shift } from "./types/ShiftTypes";
import ShiftCard from "./ShiftCard";
import { Checkbox } from "@/components/ui/checkbox";
import { CardSkeleton } from "@/components/ui/enhanced-loading";

interface ShiftGridProps {
  shifts: Shift[];
  selectedShifts?: string[];
  onSelectShift?: (shiftId: string) => void;
  loading?: boolean;
}

const ShiftGrid = React.memo(({ 
  shifts, 
  selectedShifts = [], 
  onSelectShift,
  loading = false
}: ShiftGridProps) => {
  if (loading) {
    return <CardSkeleton count={8} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" />;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {shifts.map((shift) => (
        <div key={shift.id} className="relative group animate-fade-in">
          {onSelectShift && (
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={selectedShifts.includes(shift.id)}
                onCheckedChange={() => onSelectShift(shift.id)}
                className="bg-background/80 border-primary/50"
              />
            </div>
          )}
          <ShiftCard
            shift={shift}
            selected={selectedShifts.includes(shift.id)}
          />
        </div>
      ))}
    </div>
  );
});

ShiftGrid.displayName = "ShiftGrid";

export default ShiftGrid;
