import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { formatCurrency } from "../utils/paymentScheduleCalculator";

interface PaymentScheduleStepProps {
  formData: any;
  paymentSchedule: any[];
  onChange: (paymentDate: string, customTerms?: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function PaymentScheduleStep({
  formData,
  paymentSchedule,
  onChange,
  onNext,
  onPrevious
}: PaymentScheduleStepProps) {
  const calculateTotalHours = () => {
    if (!formData.dateRange?.from || !formData.dateRange?.to) return 0;
    const days = Math.ceil((formData.dateRange.to.getTime() - formData.dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const [startHour, startMin] = formData.startTime.split(":").map(Number);
    const [endHour, endMin] = formData.endTime.split(":").map(Number);
    const dailyHours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
    return days * dailyHours;
  };

  const calculateTotalPay = () => {
    const totalHours = calculateTotalHours();
    const rate = parseFloat(formData.payRate) || 0;
    
    if (formData.payRateType === "hourly") {
      return rate * totalHours;
    } else if (formData.payRateType === "daily") {
      const days = Math.ceil((formData.dateRange?.to?.getTime() - formData.dateRange?.from?.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return rate * days;
    } else {
      return rate;
    }
  };

  const totalPay = calculateTotalPay();
  const paymentDate = formData.paymentDate || new Date().toISOString().split("T")[0];
  const customTerms = formData.customPaymentTerms || "";

  const handlePaymentDateChange = (newDate: string) => {
    onChange(newDate, customTerms);
  };

  const handleCustomTermsChange = (newTerms: string) => {
    onChange(paymentDate, newTerms);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>💰 Payment Schedule</CardTitle>
        <CardDescription>
          Define when and how much promoters will be paid
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Total estimated payment per promoter: <strong>{formatCurrency(totalPay)}</strong>
          </AlertDescription>
        </Alert>

        {/* Payment Breakdown */}
        <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900">Payment Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-800">Gross Amount:</span>
              <strong className="text-green-900">{formatCurrency(totalPay)}</strong>
            </div>
            <div className="border-t border-green-300 pt-2 flex justify-between font-bold text-green-900">
              <span>Net Amount (to promoter):</span>
              <span className="text-lg">{formatCurrency(totalPay)}</span>
            </div>
          </div>
        </div>

        {/* Payment Date */}
        <div className="space-y-2">
          <Label htmlFor="paymentDate">Payment Date *</Label>
          <Input
            id="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(e) => handlePaymentDateChange(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
          <p className="text-xs text-muted-foreground">
            Select when promoters should receive their payment
          </p>
        </div>

        {/* Payment Terms */}
        <div className="space-y-2">
          <Label htmlFor="customTerms">Additional Payment Terms (Optional)</Label>
          <Textarea
            id="customTerms"
            placeholder="e.g., Bonus conditions, deduction details, payment method preferences..."
            value={customTerms}
            onChange={(e) => handleCustomTermsChange(e.target.value)}
            rows={4}
          />
        </div>

        {/* Payment Timeline */}
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900">Payment Timeline</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">
                Shift starts: <strong>{formData.dateRange?.from?.toLocaleDateString()}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-gray-700">
                Shift ends: <strong>{formData.dateRange?.to?.toLocaleDateString()}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">
                Payment date: <strong>{new Date(paymentDate).toLocaleDateString()}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button onClick={onPrevious} variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Details
          </Button>
          <Button onClick={onNext} size="lg" className="gap-2">
            Review Contract Preview
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
