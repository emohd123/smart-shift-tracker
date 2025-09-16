import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import usePromoters from "./usePromoters";
import useShiftSubmission from "./useShiftSubmission";
import { ShiftFormData } from "../types/ShiftTypes";

export default function useShiftForm(onExternalSubmit?: (data: ShiftFormData) => void) {
  const [formData, setFormData] = useState<ShiftFormData>({
    title: "",
    location: "",
    dateRange: undefined,
    startTime: "",
    endTime: "",
    payRate: "",
    payRateType: "hour",
    selectedPromoterIds: []
  });

  const { promoters, loadingPromoters, error: promotersError, refetch: refetchPromoters } = usePromoters();
  const { submitShift, loading } = useShiftSubmission();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setFormData(prev => ({ ...prev, dateRange: range }));
  };

  const handlePayRateTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, payRateType: value }));
  };

  const handlePromoterSelect = (promoterId: string) => {
    setFormData(prev => {
      if (promoterId === "none") {
        return { ...prev, selectedPromoterIds: [] };
      }
      
      if (prev.selectedPromoterIds.includes(promoterId)) {
        return {
          ...prev,
          selectedPromoterIds: prev.selectedPromoterIds.filter(id => id !== promoterId)
        };
      }
      
      return {
        ...prev,
        selectedPromoterIds: [...prev.selectedPromoterIds, promoterId]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (onExternalSubmit) {
      e.preventDefault();
      onExternalSubmit(formData);
    } else {
      submitShift(formData, e);
    }
  };

  return {
    formData,
    loading,
    loadingPromoters,
    promoters,
    promotersError,
    refetchPromoters,
    handleInputChange,
    handleDateRangeChange,
    handlePayRateTypeChange,
    handlePromoterSelect,
    handleSubmit
  };
}
