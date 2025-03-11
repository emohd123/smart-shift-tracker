
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Shift } from "../../shifts/ShiftCard";
import { cn } from "@/lib/utils";
import { formatBHD } from "../../shifts/utils/currencyUtils";

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
          <Card 
            key={index}
            className={cn(
              "hover-scale button-press cursor-pointer",
              "border-border/50 hover:border-border"
            )}
            onClick={() => onSelectShift(shift)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{shift.title}</h3>
                  <div className="flex items-center mt-1">
                    <Calendar size={14} className="text-muted-foreground mr-1" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(shift.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium">
                    {shift.startTime} - {shift.endTime}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatBHD(shift.payRate)}/hr
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
