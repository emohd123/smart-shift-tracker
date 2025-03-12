
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PayRateFieldProps = {
  payRate: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function PayRateField({ payRate, onInputChange }: PayRateFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="payRate">Pay Rate (Per Hour)</Label>
      <div className="flex items-center">
        <span className="mr-2">$</span>
        <Input
          id="payRate"
          name="payRate"
          type="number"
          min="0"
          step="0.01"
          value={payRate}
          onChange={onInputChange}
          required
        />
      </div>
    </div>
  );
}
