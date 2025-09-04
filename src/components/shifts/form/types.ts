
import { DateRange } from "react-day-picker";
import { PromoterOption } from "../ShiftForm";

export interface ShiftFormData {
  title: string;
  location: string;
  dateRange: DateRange | undefined;
  startTime: string;
  endTime: string;
  payRate: string;
  payRateType: string;
  selectedPromoterIds: string[];
}
