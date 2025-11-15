import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import usePromoters from "./usePromoters";
import useShiftSubmission from "./useShiftSubmission";
import { ShiftFormData, Shift } from "../types/ShiftTypes";

interface UseShiftFormProps {
  initialData?: Shift;
  onExternalSubmit?: (data: ShiftFormData) => void;
}

export default function useShiftForm({ initialData, onExternalSubmit }: UseShiftFormProps = {}) {
  const [formData, setFormData] = useState<ShiftFormData>(() => {
    if (initialData) {
      return {
        title: initialData.title,
        location: initialData.location || "",
        dateRange: {
          from: new Date(initialData.date),
          to: initialData.endDate ? new Date(initialData.endDate) : undefined
        },
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        payRate: initialData.payRate.toString(),
        payRateType: initialData.payRateType || "hourly",
        selectedPromoterIds: []
      };
    }
    return {
      title: "",
      location: "",
      dateRange: undefined,
      startTime: "",
      endTime: "",
      payRate: "",
      payRateType: "hourly",
      selectedPromoterIds: []
    };
  });

  const { promoters, loadingPromoters } = usePromoters();
  const { submitShift, loading } = useShiftSubmission(initialData?.id);

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
    handleInputChange,
    handleDateRangeChange,
    handlePayRateTypeChange,
    handlePromoterSelect,
    handleSubmit
  };
}
