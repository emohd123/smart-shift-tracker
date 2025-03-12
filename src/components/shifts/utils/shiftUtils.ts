
import { Shift } from "../ShiftCard";
import { ShiftStatus } from "@/types/database";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import React from "react";

/**
 * Format date to display in a more readable format
 */
export const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

/**
 * Get status badge design based on shift status
 */
export const getStatusBadge = (status: ShiftStatus) => {
  switch (status) {
    case ShiftStatus.Upcoming:
      return { 
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        icon: React.createElement(Calendar, { size: 14, className: "mr-1" })
      };
    case ShiftStatus.Ongoing:
      return { 
        color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        icon: React.createElement(Clock, { size: 14, className: "mr-1" })
      };
    case ShiftStatus.Completed:
      return { 
        color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
        icon: React.createElement(CheckCircle, { size: 14, className: "mr-1" })
      };
    case ShiftStatus.Cancelled:
      return { 
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: React.createElement(XCircle, { size: 14, className: "mr-1" })
      };
    default:
      return { 
        color: "bg-gray-100 text-gray-700",
        icon: React.createElement(AlertCircle, { size: 14, className: "mr-1" })
      };
  }
};
