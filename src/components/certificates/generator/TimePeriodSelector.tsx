
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePeriod } from "../types/certificate";

type TimePeriodSelectorProps = {
  timePeriod: TimePeriod;
  setTimePeriod: (value: TimePeriod) => void;
};

export default function TimePeriodSelector({ timePeriod, setTimePeriod }: TimePeriodSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="timePeriod" className="text-sm font-medium">Select Time Period for Certificate</Label>
      <Select 
        value={timePeriod} 
        onValueChange={(value) => setTimePeriod(value as TimePeriod)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select time period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3months">Last 3 Months</SelectItem>
          <SelectItem value="6months">Last 6 Months</SelectItem>
          <SelectItem value="1year">Last 1 Year</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">
        The selected time period will determine which work history is included in your certificate.
      </p>
    </div>
  );
}
