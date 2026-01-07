
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, MapPin, AlertCircle, Play, Calendar } from "lucide-react";
import { Shift } from "../../shifts/types/ShiftTypes";
import { formatBHD } from "../../shifts/utils/currencyUtils";

type NextShiftCardProps = {
  nextShift: Shift | undefined | null;
  isCurrentShift?: boolean;
  onViewDetails: () => void;
};

export default function NextShiftCard({ nextShift, isCurrentShift = false, onViewDetails }: NextShiftCardProps) {
  if (!nextShift) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Current Shift
        </h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No Active Shifts</h3>
            <p className="text-muted-foreground text-center mb-4">
              You don't have any active shifts at the moment.
            </p>
            <Button variant="outline" onClick={onViewDetails}>
              Browse Shifts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date range for multi-day shifts
  const formatDateRange = () => {
    const startDate = new Date(nextShift.date).toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (nextShift.endDate && nextShift.endDate !== nextShift.date) {
      const endDate = new Date(nextShift.endDate).toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      return `${startDate} - ${endDate}`;
    }
    
    return new Date(nextShift.date).toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        {isCurrentShift ? (
          <Play className="h-5 w-5 text-green-600 fill-current" />
        ) : (
          <Calendar className="h-5 w-5 text-primary" />
        )}
        Current Shift
      </h2>
      <Card className={`border transition-colors duration-300 ${
        isCurrentShift 
          ? 'border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:border-green-500/50' 
          : 'border-primary/10 hover:border-primary/30'
      }`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{nextShift.title}</CardTitle>
              <CardDescription className="mt-1">
                <span className="text-muted-foreground">
                  {formatDateRange()}
                </span>
              </CardDescription>
            </div>
            {isCurrentShift ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse">
                <Play className="h-3 w-3 mr-1 fill-current" />
                In Progress
              </Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Upcoming
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Clock size={16} className="mr-3" />
              <span>{nextShift.startTime} - {nextShift.endTime}</span>
            </div>
            
            {nextShift.location && (
              <div className="flex items-center text-muted-foreground">
                <MapPin size={16} className="mr-3" />
                <span>{nextShift.location}</span>
              </div>
            )}
            
            <div className="flex items-center text-muted-foreground">
              <DollarSign size={16} className="mr-3" />
              <span>{formatBHD(nextShift.payRate)}/{nextShift.payRateType || 'hr'}</span>
            </div>
          </div>
        </CardContent>
        <div className="px-6 pb-6">
          <Button 
            onClick={onViewDetails}
            className={`w-full ${isCurrentShift ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {isCurrentShift ? 'View Progress' : 'View Details'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
