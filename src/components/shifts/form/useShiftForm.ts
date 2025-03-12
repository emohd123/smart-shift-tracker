
import { useState } from "react";
import { DateRange } from "react-day-picker";
import usePromoters from "./usePromoters";
import useShiftSubmission from "./useShiftSubmission";
import { ShiftFormData, UseShiftFormReturn } from "./types";

export default function useShiftForm(): UseShiftFormReturn {
  const { promoters, loadingPromoters } = usePromoters();
  const { submitShift, loading } = useShiftSubmission();
  
  const [formData, setFormData] = useState<ShiftFormData>({
    title: "",
    location: "",
    dateRange: undefined,
    startTime: "09:00",
    endTime: "17:00",
    payRate: "15",
    payRateType: "hour",
    selectedPromoterId: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setFormData({
      ...formData,
      dateRange: range
    });
  };

  const handlePayRateTypeChange = (value: string) => {
    setFormData({
      ...formData,
      payRateType: value
    });
  };

  const handlePromoterSelect = (value: string) => {
    setFormData({
      ...formData,
      selectedPromoterId: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    return submitShift(formData, e);
  };

  return {
    formData,
    loading,
    loadingPromoters,
    promoters,
    handleInputChange,
    handleDateRangeChange,
    handlePayRateTypeChange,
    handlePromoterSelect,
    handleSubmit
  };
}
