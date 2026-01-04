import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Send, Loader2, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { formatCurrency, calculateWorkHours, calculateDailyPay } from "../utils/paymentScheduleCalculator";
import { generateContractTemplate } from "../utils/contractTemplateGenerator";

interface ContractReviewStepProps {
  formData: any;
  paymentSchedule?: any[];
  contractPreview?: string;
  loading?: boolean;
  onPrevious: () => void;
  onSubmit: () => Promise<{ shiftId?: string; success: boolean }>;
  isSubmitting?: boolean;
}

export default function ContractReviewStep({
  formData,
  paymentSchedule,
  contractPreview,
  loading = false,
  onPrevious,
  onSubmit,
  isSubmitting = false
}: ContractReviewStepProps) {
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateWorkHoursForShift = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    return calculateWorkHours(formData.startTime, formData.endTime);
  };

  const calculatePayForPromoter = (workHours: number) => {
    const rate = parseFloat(formData.payRate) || 0;
    if (formData.payRateType === "hourly") {
      return calculateDailyPay(rate, workHours);
    } else if (formData.payRateType === "daily") {
      return rate;
    } else {
      return rate;
    }
  };

  const workHours = calculateWorkHoursForShift();
  const estimatedPayPerPromoter = calculatePayForPromoter(workHours);
  const totalEstimatedPay = estimatedPayPerPromoter * formData.assignedPromoters.length;

  const handleSubmit = async () => {
    try {
      setError(null);
      await onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit contract");
    }
  };

  const contractHtml = generateContractTemplate({
    shiftTitle: formData.title || "Untitled Shift",
    description: formData.description || "",
    location: formData.location || "TBD",
    startDate: formData.dateRange?.from || new Date(),
    endDate: formData.dateRange?.to || new Date(),
    startTime: formData.startTime || "TBD",
    endTime: formData.endTime || "TBD",
    payRate: parseFloat(formData.payRate) || 0,
    payRateType: formData.payRateType || "daily",
    paymentDate: typeof formData.paymentDate === 'string' 
      ? new Date(formData.paymentDate)
      : (formData.paymentDate || new Date()),
    promoterCount: formData.assignedPromoters.length,
    totalEstimatedPay: totalEstimatedPay,
    customTerms: formData.customTerms || ""
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 Review & Send Contracts</CardTitle>
        <CardDescription>
          Final review before sending contracts to {formData.assignedPromoters.length} promoters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Shift Summary */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">📝 Shift Details Summary</h3>
          <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div>
              <span className="text-sm text-gray-600">Title:</span>
              <p className="font-semibold text-gray-900">{formData.title || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Location:</span>
              <p className="font-semibold text-gray-900">{formData.location || "N/A"}</p>
            </div>
            <div className="text-sm text-gray-600">Dates:</div>
              <p className="font-semibold text-gray-900">
                {formData.dateRange?.from
                  ? `${(formData.dateRange.from instanceof Date ? formData.dateRange.from : new Date(formData.dateRange.from)).toLocaleDateString()} - ${
                      formData.dateRange.to
                        ? (formData.dateRange.to instanceof Date ? formData.dateRange.to : new Date(formData.dateRange.to)).toLocaleDateString()
                        : "Same day"
                    }`
                  : "N/A"}
              </p>
            <div>
              <span className="text-sm text-gray-600">Time:</span>
              <p className="font-semibold text-gray-900">
                {formData.startTime} - {formData.endTime}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Description:</span>
              <p className="font-semibold text-gray-900">{formData.description || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Work Hours:</span>
              <p className="font-semibold text-gray-900">{workHours} hours</p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">💰 Payment Summary</h3>
          <div className="space-y-2 bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Pay Rate:</span>
              <Badge>{formData.payRate} NGN ({formData.payRateType})</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Per Promoter (Estimated):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(estimatedPayPerPromoter)}</span>
            </div>
            <div className="border-t border-green-200 pt-2 flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Total ({formData.assignedPromoters.length} promoters):
              </span>
              <span className="text-lg font-bold text-green-600">{formatCurrency(totalEstimatedPay)}</span>
            </div>
            <div className="text-sm text-gray-600">Payment scheduled for:</div>
            <div className="text-sm text-gray-600 mt-2">
              {formData.paymentDate 
                ? (typeof formData.paymentDate === 'string' 
                  ? new Date(formData.paymentDate).toLocaleDateString()
                  : formData.paymentDate.toLocaleDateString())
                : "To be determined"}
            </div>
          </div>
        </div>

        {/* Promoters List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">👥 Assigned Promoters</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {formData.assignedPromoters.map((promoter: any, index: number) => (
              <div
                key={promoter.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{promoter.fullName}</div>
                    <div className="text-sm text-gray-600">{promoter.uniqueCode}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{promoter.workHours} hrs</div>
                  <div className="font-semibold text-gray-900">{formatCurrency(promoter.estimatedPay)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Preview Toggle */}
        <div className="border-t pt-6">
          <Button
            variant="outline"
            onClick={() => setShowContractPreview(!showContractPreview)}
            className="w-full gap-2"
          >
            {showContractPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Contract Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                View Contract Preview
              </>
            )}
          </Button>

          {showContractPreview && (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                srcDoc={contractHtml}
                className="w-full h-[600px] border-none"
                title="Contract Preview"
              />
            </div>
          )}
        </div>

        {/* Confirmation Alert */}
        <Alert className="bg-amber-50 border-amber-200">
          <CheckCircle2 className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            Contracts will be generated and sent to all {formData.assignedPromoters.length} promoters with
            payment details. They can review and approve before the shift starts.
          </AlertDescription>
        </Alert>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button onClick={onPrevious} variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Promoters
          </Button>
          <Button
            onClick={handleSubmit}
            size="lg"
            className="gap-2"
            disabled={isSubmitting || formData.assignedPromoters.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Contracts...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Contracts to {formData.assignedPromoters.length} Promoters
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
