
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, MapPin, AlertCircle } from "lucide-react";
import { Shift } from "../../shifts/types/ShiftTypes";
import { formatBHD } from "../../shifts/utils/currencyUtils";

type NextShiftCardProps = {
  nextShift: Shift | undefined;
  onViewDetails: () => void;
};

export default function NextShiftCard({ nextShift, onViewDetails }: NextShiftCardProps) {
  if (!nextShift) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Next Shift</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No Upcoming Shifts</h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any shifts scheduled at the moment.
            </p>
            <Button variant="outline" onClick={onViewDetails}>
              Check Available Shifts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Next Shift</h2>
      <Card className="border border-primary/10 hover:border-primary/30 transition-colors duration-300">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{nextShift.title}</CardTitle>
              <CardDescription className="mt-1">
                <span className="text-muted-foreground">
                  {new Date(nextShift.date).toLocaleDateString(undefined, { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </CardDescription>
            </div>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Upcoming
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Clock size={16} className="mr-3" />
              <span>{nextShift.startTime} - {nextShift.endTime}</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <MapPin size={16} className="mr-3" />
              <span>{nextShift.location}</span>
            </div>
            
            <div className="flex items-center text-muted-foreground">
              <DollarSign size={16} className="mr-3" />
              <span>{formatBHD(nextShift.payRate)}/hr</span>
            </div>
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button 
            onClick={onViewDetails}
            className="w-full"
          >
            View Details
          </Button>
        </div>
      </Card>
    </div>
  );
}
