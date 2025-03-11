
import { Button } from "@/components/ui/button";
import { Shift } from "../../shifts/ShiftCard";
import DashboardShiftCard from "./DashboardShiftCard";

type UpcomingShiftsListProps = {
  shifts: Shift[];
  onViewAll: () => void;
  onSelectShift: (shift: Shift) => void;
};

export default function UpcomingShiftsList({ 
  shifts, 
  onViewAll, 
  onSelectShift 
}: UpcomingShiftsListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Upcoming Shifts</h2>
        <Button variant="outline" size="sm" onClick={onViewAll}>
          View All
        </Button>
      </div>
      
      <div className="space-y-3">
        {shifts.map((shift, index) => (
          <DashboardShiftCard
            key={index}
            shift={shift}
            onClick={() => onSelectShift(shift)}
          />
        ))}
      </div>
    </div>
  );
}
