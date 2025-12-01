
import { ShiftStatus } from "@/types/database";
import { Shift } from "../types/ShiftTypes";

export const calculateShiftStatus = (shift: Shift): ShiftStatus => {
  // If manual override is enabled, use override status
  if (shift.manual_status_override && shift.override_status) {
    return shift.override_status as ShiftStatus;
  }

  const now = new Date();
  const shiftDate = new Date(shift.date);
  const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
  const shiftEnd = new Date(`${shift.date}T${shift.endTime}`);

  // Handle multi-day shifts
  if (shift.endDate) {
    const shiftEndDate = new Date(`${shift.endDate}T${shift.endTime}`);
    if (now > shiftEndDate) {
      return ShiftStatus.Completed;
    }
    if (now >= shiftStart && now <= shiftEndDate) {
      return ShiftStatus.Ongoing;
    }
    return ShiftStatus.Upcoming;
  }

  // Single day shift
  if (now > shiftEnd) {
    return ShiftStatus.Completed;
  }
  if (now >= shiftStart && now <= shiftEnd) {
    return ShiftStatus.Ongoing;
  }
  return ShiftStatus.Upcoming;
};

export const getStatusColor = (status: ShiftStatus): string => {
  switch (status) {
    case ShiftStatus.Upcoming:
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case ShiftStatus.Ongoing:
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case ShiftStatus.Completed:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    case ShiftStatus.Cancelled:
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

export const getEffectiveStatus = (shift: Shift): ShiftStatus => {
  // If manual override is enabled, use override status
  if (shift.manual_status_override && shift.override_status) {
    return shift.override_status as ShiftStatus;
  }
  // Otherwise use the calculated status
  return shift.status as ShiftStatus;
};

export const getStatusLabel = (status: ShiftStatus): string => {
  switch (status) {
    case ShiftStatus.Upcoming:
      return "Upcoming";
    case ShiftStatus.Ongoing:
      return "Ongoing";
    case ShiftStatus.Completed:
      return "Completed";
    case ShiftStatus.Cancelled:
      return "Cancelled";
    default:
      return "Unknown";
  }
};
