
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type DateTimeFieldsProps = {
  date: Date;
  startTime: string;
  endTime: string;
  onDateChange: (date: Date | undefined) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function DateTimeFields({
  date,
  startTime,
  endTime,
  onDateChange,
  onInputChange
}: DateTimeFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
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
  );
}
