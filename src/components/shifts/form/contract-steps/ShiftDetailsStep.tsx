import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShiftDetailsStepProps {
  formData: any;
  onChange: (fields: any) => void;
  onNext: () => void;
}

export default function ShiftDetailsStep({
  formData,
  onChange,
  onNext
}: ShiftDetailsStepProps) {
  const handleInputChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const handleDateRangeChange = (type: "from" | "to", date: Date | undefined) => {
    onChange({
      dateRange: {
        ...formData.dateRange,
        [type]: date
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📌 Shift Details</CardTitle>
        <CardDescription>
          Provide comprehensive information about the shift you want to create
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shift Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Shift Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Product Launch Event, Brand Activation"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the shift responsibilities and requirements..."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={4}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            placeholder="e.g., Lagos Shopping Mall, Lekki Phase 1"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.dateRange?.from ? formData.dateRange.from.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateRangeChange("from", e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.dateRange?.to ? formData.dateRange.to.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateRangeChange("to", e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => handleInputChange("startTime", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleInputChange("endTime", e.target.value)}
            />
          </div>
        </div>

        {/* Pay Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payRate">Pay Rate (BHD) *</Label>
            <Input
              id="payRate"
              type="number"
              placeholder="0.000"
              value={formData.payRate}
              onChange={(e) => handleInputChange("payRate", e.target.value)}
              step="0.001"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payRateType">Payment Type *</Label>
            <Select value={formData.payRateType} onValueChange={(value) => handleInputChange("payRateType", value)}>
              <SelectTrigger id="payRateType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly Rate</SelectItem>
                <SelectItem value="daily">Daily Rate (8 hours)</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-6">
          <Button onClick={onNext} size="lg" className="gap-2">
            Continue to Payment Schedule
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
