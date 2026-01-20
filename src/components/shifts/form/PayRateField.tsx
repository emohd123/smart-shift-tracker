
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { tooltips } from "@/config/tooltips";

type PayRateFieldProps = {
  payRate: string;
  payRateType: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPayRateTypeChange: (value: string) => void;
  required?: boolean;
};

export default function PayRateField({ 
  payRate, 
  payRateType, 
  onInputChange, 
  onPayRateTypeChange,
  required = true
}: PayRateFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor="payRate">Pay Rate {required ? "" : "(Optional)"}</Label>
        <HelpTooltip content={required ? tooltips.company.shifts.payRate : "Leave blank if the pay rate is not yet determined. You can set it later before processing payments. Shifts without pay rates will need to be updated before promoters can be paid."} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center col-span-2">
          <span className="mr-2">BHD</span>
          <Input
            id="payRate"
            name="payRate"
            type="number"
            min="0"
            step="0.01"
            value={payRate}
            onChange={onInputChange}
            required={required}
            placeholder="Enter pay rate"
            className="focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="payRateType">Rate Type</Label>
            <HelpTooltip content={tooltips.company.shifts.payRateType} />
          </div>
          <Select 
            value={payRateType} 
            onValueChange={onPayRateTypeChange}
          >
            <SelectTrigger id="payRateType">
              <SelectValue placeholder="Per hour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Per Hour</SelectItem>
              <SelectItem value="daily">Per Day</SelectItem>
              <SelectItem value="monthly">Per Month</SelectItem>
              <SelectItem value="fixed">Fixed Rate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {!required && (
        <p className="text-xs text-muted-foreground">
          Leave blank if pay rate is not yet determined
        </p>
      )}
    </div>
  );
}
