
import { Card, CardContent } from "@/components/ui/card";
import ShiftFormHeader from "./form/ShiftFormHeader";
import BasicInfoFields from "./form/BasicInfoFields";
import DateTimeFields from "./form/DateTimeFields";
import PayRateField from "./form/PayRateField";
import PromoterSelector from "./form/PromoterSelector";
import LocationMapToggle from "./form/LocationMapToggle";
import SubmitButton from "./form/SubmitButton";
import useShiftForm from "./form/useShiftForm";

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

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <ShiftFormHeader />
        
        <CardContent className="space-y-4">
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
