
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoterData } from "./types";
import { Users, Clock, Award, CalendarCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PromoterStatsProps {
  promoters: PromoterData[];
  loading: boolean;
}

export function PromoterStats({ promoters, loading }: PromoterStatsProps) {
  // Calculate statistics
  const totalPromoters = promoters.length;
  const activePromoters = promoters.filter(p => p.verification_status === "approved").length;
  const totalHours = promoters.reduce((sum, p) => sum + p.total_hours, 0);
  const totalShifts = promoters.reduce((sum, p) => sum + p.total_shifts, 0);
  const avgRating = promoters.length > 0 
    ? promoters.reduce((sum, p) => sum + p.average_rating, 0) / promoters.length 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Promoters
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{totalPromoters}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {activePromoters} active promoters
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Hours
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Across all promoters
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Shifts
          </CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{totalShifts}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {(totalShifts / Math.max(1, totalPromoters)).toFixed(1)} shifts per promoter
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Rating
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}/5</div>
          )}
          <p className="text-xs text-muted-foreground">
            Based on performance reviews
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
