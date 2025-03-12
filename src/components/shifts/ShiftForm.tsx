
import { Card, CardContent } from "@/components/ui/card";
import ShiftFormHeader from "./form/ShiftFormHeader";
import BasicInfoFields from "./form/BasicInfoFields";
import DateTimeFields from "./form/DateTimeFields";
import PayRateField from "./form/PayRateField";
import PromoterSelector from "./form/PromoterSelector";
import LocationMapToggle from "./form/LocationMapToggle";
import SubmitButton from "./form/SubmitButton";
import useShiftForm from "./form/useShiftForm";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
    handlePaymentStatusChange,
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
            required={false}
          />
          
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select 
              value={formData.paymentStatus} 
              onValueChange={handlePaymentStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
