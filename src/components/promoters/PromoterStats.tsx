
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromoterData } from "./types";
import { Users, Clock, Award, CalendarCheck, UserCheck, Clock3, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PromoterStatsProps {
  promoters: PromoterData[];
  loading: boolean;
}

export function PromoterStats({ promoters, loading }: PromoterStatsProps) {
  // Calculate statistics
  const totalPromoters = promoters.length;
  const activePromoters = promoters.filter(p => p.verification_status === "approved").length;
  const pendingPromoters = promoters.filter(p => p.verification_status === "pending").length;
  const totalHours = promoters.reduce((sum, p) => sum + p.total_hours, 0);
  const totalShifts = promoters.reduce((sum, p) => sum + p.total_shifts, 0);
  const avgRating = promoters.length > 0 
    ? promoters.reduce((sum, p) => sum + p.average_rating, 0) / promoters.length 
    : 0;
  
  // Calculate average hours per promoter
  const avgHoursPerPromoter = totalPromoters > 0 
    ? totalHours / totalPromoters
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Promoter Status
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total:</span>
                <span className="text-xl font-bold">{totalPromoters}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-green-600">
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                  <span>Active:</span>
                </div>
                <span className="font-medium text-green-600">{activePromoters}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600">Pending:</span>
                <span className="font-medium text-amber-600">{pendingPromoters}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Working Hours
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Hours:</span>
                <span className="text-xl font-bold">{totalHours.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5 mr-1" />
                  <span>Avg per promoter:</span>
                </div>
                <span className="font-medium">{avgHoursPerPromoter.toFixed(1)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Shift Assignments
          </CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Shifts:</span>
                <span className="text-xl font-bold">{totalShifts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Per promoter:</span>
                <span className="font-medium">{(totalShifts / Math.max(1, totalPromoters)).toFixed(1)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Performance Rating
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average:</span>
                <div className="flex items-center">
                  <span className="text-xl font-bold mr-1">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">/5</span>
                </div>
              </div>
              <div className="flex items-center text-amber-500 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-current" : "text-muted-foreground opacity-30"}`} 
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
