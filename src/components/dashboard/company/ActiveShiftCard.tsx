import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ShiftWithLiveData } from "@/hooks/company/useCompanyLiveData";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";

interface ActiveShiftCardProps {
  shift: ShiftWithLiveData;
}

export default function ActiveShiftCard({ shift }: ActiveShiftCardProps) {
  const formatElapsedTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const totalHours = shift.activePromoters.reduce((sum, p) => sum + p.elapsedHours, 0);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <span className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  LIVE
                </span>
              </Badge>
            </div>
            <CardTitle className="text-xl">{shift.title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(shift.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {shift.startTime} - {shift.endTime}
            </span>
          </div>
          {shift.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{shift.location}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Promoters</span>
            </div>
            <p className="text-lg font-bold">
              {shift.activePromoters.length} / {shift.totalAssigned}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Total Hours</span>
            </div>
            <p className="text-lg font-bold">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <span className="text-xs font-medium">Live Earnings</span>
            </div>
            <p className="text-lg font-bold">{formatBHD(shift.liveEarnings)}</p>
          </div>
        </div>

        {shift.activePromoters.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3">Currently Working:</p>
            <div className="space-y-2">
              {shift.activePromoters.map((promoter) => (
                <div
                  key={promoter.id}
                  className="flex items-center justify-between p-3 bg-background border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{promoter.name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {formatElapsedTime(promoter.elapsedHours)}
                    </span>
                    <span className="font-semibold">
                      {formatBHD(promoter.currentEarnings)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link to={`/shifts/${shift.id}`}>
            View Full Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
