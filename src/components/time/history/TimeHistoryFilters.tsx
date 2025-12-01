import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface TimeHistoryFiltersProps {
  dateFrom: Date | null;
  dateTo: Date | null;
  selectedShiftId: string;
  minEarnings: number;
  shifts: Array<{ id: string; title: string }>;
  onDateFromChange: (date: Date | null) => void;
  onDateToChange: (date: Date | null) => void;
  onShiftChange: (shiftId: string) => void;
  onMinEarningsChange: (amount: number) => void;
  onClearFilters: () => void;
}

export default function TimeHistoryFilters({
  dateFrom,
  dateTo,
  selectedShiftId,
  minEarnings,
  shifts,
  onDateFromChange,
  onDateToChange,
  onShiftChange,
  onMinEarningsChange,
  onClearFilters
}: TimeHistoryFiltersProps) {
  const hasActiveFilters = dateFrom || dateTo || selectedShiftId || minEarnings > 0;

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">From Date</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom ? dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => onDateFromChange(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo">To Date</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo ? dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => onDateToChange(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift">Shift</Label>
            <Select value={selectedShiftId} onValueChange={onShiftChange}>
              <SelectTrigger id="shift">
                <SelectValue placeholder="All shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shifts</SelectItem>
                {shifts.map(shift => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {shift.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minEarnings">Min Earnings (BHD)</Label>
            <Input
              id="minEarnings"
              type="number"
              min="0"
              step="0.1"
              value={minEarnings || ''}
              onChange={(e) => onMinEarningsChange(parseFloat(e.target.value) || 0)}
              placeholder="0.000"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
