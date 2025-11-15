
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { PromoterOption } from "../types/PromoterTypes";
import { Shift, ShiftFormData } from "../types/ShiftTypes";
import ShiftFormHeader from "./ShiftFormHeader";
import BasicInfoFields from "./BasicInfoFields";
import DateTimeFields from "./DateTimeFields";
import PayRateField from "./PayRateField";
import PromoterSelector from "./PromoterSelector";
import LocationMapToggle from "./LocationMapToggle";
import SubmitButton from "./SubmitButton";
import useShiftForm from "./useShiftForm";
import ValidationErrors from "./ValidationErrors";

interface ShiftFormProps {
  shift?: Shift;
  onExternalSubmit?: (data: ShiftFormData) => void;
}

export function ShiftForm({ shift, onExternalSubmit }: ShiftFormProps = {}) {
  const isEditMode = !!shift;
  
  const {
    formData,
    loading,
    loadingPromoters,
    promoters,
    handleInputChange,
    handleDateRangeChange,
    handlePayRateTypeChange,
    handlePromoterSelect,
    handleSubmit
  } = useShiftForm({ initialData: shift, onExternalSubmit });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateForm = (e: React.FormEvent): boolean => {
    e.preventDefault();
    const errors: string[] = [];

    if (!formData.title?.trim()) {
      errors.push("Shift title is required");
    }

    if (!formData.location?.trim()) {
      errors.push("Location is required");
    }

    if (!formData.dateRange?.from) {
      errors.push("Start date is required");
    }

    if (!formData.startTime) {
      errors.push("Start time is required");
    }

    if (!formData.endTime) {
      errors.push("End time is required");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    if (validateForm(e)) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <ShiftFormHeader title={isEditMode ? "Edit Shift" : "Create New Shift"} />
        
        <CardContent className="space-y-4">
          {validationErrors.length > 0 && (
            <ValidationErrors errors={validationErrors} />
          )}
          
          {isEditMode ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Editing Shift</AlertTitle>
              <AlertDescription>
                Update shift details below. Note: Modifying dates may affect assigned promoters.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>
                Fill in all required fields to create a new shift. You can assign multiple promoters and set a precise location.
              </AlertDescription>
            </Alert>
          )}

          <BasicInfoFields
            title={formData.title}
            location={formData.location}
            onInputChange={handleInputChange}
          />
          
          <DateTimeFields
            dateRange={formData.dateRange}
            startTime={formData.startTime}
            endTime={formData.endTime}
            onDateRangeChange={handleDateRangeChange}
            onInputChange={handleInputChange}
          />
          
          <PayRateField
            payRate={formData.payRate}
            payRateType={formData.payRateType}
            onInputChange={handleInputChange}
            onPayRateTypeChange={handlePayRateTypeChange}
            required={false}
          />
          
          {!isEditMode && (
            <PromoterSelector
              promoters={promoters}
              selectedPromoterIds={formData.selectedPromoterIds}
              onSelect={handlePromoterSelect}
              loading={loadingPromoters}
            />
          )}
          
          <LocationMapToggle />
        </CardContent>
        
        <SubmitButton 
          loading={loading}
          label={isEditMode ? "Update Shift" : "Create Shift"}
        />
      </Card>
    </form>
  );
}
