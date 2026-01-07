import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { BarChart3, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { usePromoterWorkHistory } from "./hooks/usePromoterWorkHistory";
import { formatBHD, formatWorkDuration } from "../utils/paymentCalculations";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PromoterWorkHistoryProps = {
  promoterId: string;
  promoterName: string;
  compact?: boolean;
};

export const PromoterWorkHistory = ({ promoterId, promoterName, compact = false }: PromoterWorkHistoryProps) => {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  const { dailyHistory, summary, loading } = usePromoterWorkHistory(promoterId, dateFrom, dateTo);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={compact ? "h-8 text-xs" : "w-full"}>
          <BarChart3 className={compact ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1"} />
          {compact ? "History" : "View Full History"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Work History: {promoterName}
          </DialogTitle>
          <DialogDescription>
            Complete work history with daily breakdown and earnings
          </DialogDescription>
        </DialogHeader>

        {/* Date Range Filter */}
        <div className="grid grid-cols-2 gap-3 py-3 border-b">
          <div className="space-y-1.5">
            <Label htmlFor="from-date" className="text-xs">From Date</Label>
            <Input
              id="from-date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to-date" className="text-xs">To Date</Label>
            <Input
              id="to-date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3 bg-accent/30">
            <p className="text-xs text-muted-foreground">Total Days</p>
            <p className="text-xl font-bold">{summary.totalDays}</p>
          </Card>
          <Card className="p-3 bg-accent/30">
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="text-xl font-bold">{formatWorkDuration(summary.totalHours)}</p>
          </Card>
          <Card className="p-3 bg-accent/30">
            <p className="text-xs text-muted-foreground">Total Earnings</p>
            <p className="text-xl font-bold text-green-600">{formatBHD(summary.totalEarnings)}</p>
          </Card>
          <Card className="p-3 bg-accent/30">
            <p className="text-xs text-muted-foreground">Avg/Day</p>
            <p className="text-xl font-bold text-green-600">{formatBHD(summary.avgPerDay)}</p>
          </Card>
        </div>

        {/* Daily Breakdown */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 sticky top-0 bg-background pb-2">
              <Calendar className="h-4 w-4" />
              Daily Breakdown
            </h3>

            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading history...</p>
            ) : dailyHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No work history found</p>
            ) : (
              dailyHistory.map((day) => (
                <Card key={day.date} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">
                        {format(new Date(day.date), "EEE, MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{day.shifts.length} shift{day.shifts.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pl-6">
                    {day.shifts.map((shift) => (
                      <div key={shift.timeLogId} className="p-2 bg-accent/30 rounded-md text-xs space-y-1">
                        <p className="font-medium">{shift.shiftTitle || "Shift"}</p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(shift.checkIn), "HH:mm")} → {" "}
                            {shift.checkOut ? format(new Date(shift.checkOut), "HH:mm") : "Active"}
                          </span>
                        </div>
                        {shift.hours > 0 && (
                          <div className="flex justify-between pt-1">
                            <span>{formatWorkDuration(shift.hours)}</span>
                            <span className="text-green-600 font-medium">{formatBHD(shift.earnings)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t flex justify-between text-sm font-medium">
                    <span>Day Total:</span>
                    <div className="flex gap-4">
                      <span>{formatWorkDuration(day.totalHours)}</span>
                      <span className="text-green-600">{formatBHD(day.totalEarnings)}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
