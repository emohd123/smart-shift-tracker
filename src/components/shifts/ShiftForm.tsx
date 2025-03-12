
import { Card, CardContent } from "@/components/ui/card";
import ShiftFormHeader from "./form/ShiftFormHeader";
import BasicInfoFields from "./form/BasicInfoFields";
import DateTimeFields from "./form/DateTimeFields";
import PayRateField from "./form/PayRateField";
import PromoterSelector from "./form/PromoterSelector";
import LocationMapToggle from "./form/LocationMapToggle";
import SubmitButton from "./form/SubmitButton";
import useShiftForm from "./form/useShiftForm";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Info } from "lucide-react";

export interface PromoterOption {
  id: string;
  full_name: string;
  email: string;
}

export function ShiftForm() {
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
  } = useShiftForm();

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
        <ShiftFormHeader />
        
        <CardContent className="space-y-4">
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>
              Fill in all required fields to create a new shift. Optionally, you can assign a promoter and set a precise location.
            </AlertDescription>
          </Alert>

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
          
          <PromoterSelector
            promoters={promoters}
            selectedPromoterId={formData.selectedPromoterId}
            onSelect={handlePromoterSelect}
            loading={loadingPromoters}
          />
          
          <LocationMapToggle />
        </CardContent>
        
        <SubmitButton loading={loading} />
      </Card>
    </form>
  );
}
