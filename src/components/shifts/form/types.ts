
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
  selectedPromoterId: string;
}

export interface UseShiftFormReturn {
  formData: ShiftFormData;
  loading: boolean;
  loadingPromoters: boolean;
  promoters: PromoterOption[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleDateRangeChange: (range: DateRange | undefined) => void;
  handlePayRateTypeChange: (value: string) => void;
  handlePromoterSelect: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}
