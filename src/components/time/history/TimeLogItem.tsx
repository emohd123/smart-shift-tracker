
import React from "react";
import { Calendar, Clock } from "lucide-react";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";

interface TimeLogItemProps {
  log: {
    id: string;
    check_in_time: string;
    check_out_time: string;
    total_hours: number;
    earnings?: number;
    shift_title?: string;
    shift_location?: string;
  };
  formatTime: (isoString: string) => string;
  formatDate: (isoString: string) => string;
  formatDuration: (hours: number) => string;
}

const TimeLogItem = ({ log, formatTime, formatDate, formatDuration }: TimeLogItemProps) => {
  return (
    <div className="border rounded-md p-4 hover:bg-muted/50 transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h4 className="font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            {formatDate(log.check_in_time)}
          </h4>
          <h3 className="text-lg font-medium mt-1">{log.shift_title || "Unknown Shift"}</h3>
          <div className="text-sm text-muted-foreground mt-1">
            {log.shift_location || "Unknown Location"}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="font-medium text-lg">
            {log.earnings ? formatBHD(log.earnings) : 'N/A'}
          </div>
          <div className="text-sm flex items-center mt-1">
            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
            {formatTime(log.check_in_time)} - {formatTime(log.check_out_time)}
          </div>
          <div className="text-sm text-muted-foreground">
            {log.total_hours ? formatDuration(log.total_hours) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeLogItem;
