import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, Clock, DollarSign } from "lucide-react";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { tooltips } from "@/config/tooltips";

interface LiveDashboardStatsProps {
  activeShifts: number;
  activePromoters: number;
  totalHours: number;
  liveEarnings: number;
}

export default function LiveDashboardStats({
  activeShifts,
  activePromoters,
  totalHours,
  liveEarnings,
}: LiveDashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-muted-foreground">Active Shifts</p>
                <HelpTooltip content={tooltips.company.dashboard.activeShifts} />
              </div>
              <p className="text-2xl font-bold mt-2">{activeShifts}</p>
            </div>
            <div className="relative">
              <Activity className="h-8 w-8 text-primary" />
              {activeShifts > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-muted-foreground">Promoters Working</p>
                <HelpTooltip content={tooltips.company.dashboard.activePromoters} />
              </div>
              <p className="text-2xl font-bold mt-2">{activePromoters}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <HelpTooltip content={tooltips.company.dashboard.totalHours} />
              </div>
              <p className="text-2xl font-bold mt-2">{totalHours.toFixed(1)}h</p>
            </div>
            <Clock className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-muted-foreground">Live Earnings</p>
                <HelpTooltip content={tooltips.company.dashboard.liveEarnings} />
              </div>
              <p className="text-2xl font-bold mt-2">{formatBHD(liveEarnings)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
