
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { Shift } from "../../shifts/types/ShiftTypes";
import { cn } from "@/lib/utils";
import { formatBHD } from "../../shifts/utils/currencyUtils";

type DashboardShiftCardProps = {
  shift: Shift;
  onClick: () => void;
};

export default function DashboardShiftCard({ shift, onClick }: DashboardShiftCardProps) {
  return (
    <Card 
      className={cn(
        "hover-scale button-press cursor-pointer",
        "border-border/50 hover:border-border"
      )}
      onClick={onClick}
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
  );
}
