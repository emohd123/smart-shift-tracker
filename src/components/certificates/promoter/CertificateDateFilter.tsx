import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CertificateDateFilterProps {
  dateFrom: Date | null;
  dateTo: Date | null;
  onDateFromChange: (date: Date | null) => void;
  onDateToChange: (date: Date | null) => void;
  onClearFilters: () => void;
}

export default function CertificateDateFilter({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearFilters
}: CertificateDateFilterProps) {
  const hasActiveFilters = dateFrom || dateTo;

  return (
    <Card className="bg-secondary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Filter by Date Range</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          Select a date range to generate certificates for specific periods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* From Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom || undefined}
                  onSelect={(date) => onDateFromChange(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM dd, yyyy") : "Select end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo || undefined}
                  onSelect={(date) => onDateToChange(date || null)}
                  initialFocus
                  disabled={(date) => dateFrom ? date < dateFrom : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-primary/5 rounded-md">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Active Filter:</span>{" "}
              {dateFrom && format(dateFrom, "MMM dd, yyyy")}
              {dateFrom && dateTo && " - "}
              {dateTo && format(dateTo, "MMM dd, yyyy")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
