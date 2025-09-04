
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
      <Label htmlFor="payRate">Pay Rate {required ? "" : "(Optional)"}</Label>
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
        <div>
          <Select 
            value={payRateType} 
            onValueChange={onPayRateTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Per hour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Per Hour</SelectItem>
              <SelectItem value="day">Per Day</SelectItem>
              <SelectItem value="month">Per Month</SelectItem>
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
