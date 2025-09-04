
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type DateTimeFieldsProps = {
  dateRange: DateRange | undefined;
  startTime: string;
  endTime: string;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function DateTimeFields({
  dateRange,
  startTime,
  endTime,
  onDateRangeChange,
  onInputChange
}: DateTimeFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Date Range</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                "Select date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              id="startTime"
              name="startTime"
              type="time"
              value={startTime}
              onChange={onInputChange}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              id="endTime"
              name="endTime"
              type="time"
              value={endTime}
              onChange={onInputChange}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
