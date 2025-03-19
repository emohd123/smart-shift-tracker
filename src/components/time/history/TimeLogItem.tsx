
import React from "react";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { formatBHD } from "@/components/shifts/utils/currencyUtils";
import { motion } from "framer-motion";

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
  index: number;
}

const TimeLogItem = ({ log, formatTime, formatDate, formatDuration, index }: TimeLogItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="border border-border/50 rounded-md p-4 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 group">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h4 className="font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              {formatDate(log.check_in_time)}
            </h4>
            <h3 className="text-lg font-medium mt-1 group-hover:text-primary transition-colors">{log.shift_title || "Unknown Shift"}</h3>
            <div className="text-sm text-muted-foreground mt-1 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {log.shift_location || "Unknown Location"}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="font-medium text-lg text-primary/90">
              {log.earnings ? formatBHD(log.earnings) : 'N/A'}
            </div>
            <div className="text-sm flex items-center mt-1 space-x-2">
              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
              <span>{formatTime(log.check_in_time)}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span>{formatTime(log.check_out_time)}</span>
            </div>
            <div className="text-sm text-primary/80 font-medium mt-1 bg-primary/5 px-2 py-0.5 rounded-full">
              {log.total_hours ? formatDuration(log.total_hours) : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TimeLogItem;
