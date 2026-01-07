import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, FileText, DollarSign, Users, Eye } from "lucide-react";
import { ShiftFormData } from "../types/ShiftTypes";
import ShiftDetailsStep from "./contract-steps/ShiftDetailsStep";
import PaymentScheduleStep from "./contract-steps/PaymentScheduleStep";
import ContractPreviewStep from "./contract-steps/ContractPreviewStep";
import PromoterAssignmentStep from "./contract-steps/PromoterAssignmentStep";
import ContractReviewStep from "./contract-steps/ContractReviewStep";
import { useShiftContractForm } from "./hooks/useShiftContractForm";

interface UnifiedShiftContractFormProps {
  initialData?: ShiftFormData;
}

export function UnifiedShiftContractForm({ initialData }: UnifiedShiftContractFormProps) {
  const [activeStep, setActiveStep] = useState<"details" | "payment" | "preview" | "promoters" | "review">("details");
  
  const {
    formData,
    paymentSchedule,
    contractPreview,
    loading,
    validationErrors,
    handleDetailsChange,
    handlePaymentChange,
    handlePromoterChange,
    handleContractChange,
    generateContractPreview,
    submitShiftAndContract
  } = useShiftContractForm({ initialData });

  // Generate contract preview when entering the preview step
  useEffect(() => {
    if (activeStep === "preview" && !formData.contractBody) {
      generateContractPreview();
    }
  }, [activeStep, generateContractPreview, formData.contractBody]);

  const stepIndicators = [
    { id: "details", label: "Shift Details", icon: FileText },
    { id: "payment", label: "Payment Schedule", icon: DollarSign },
    { id: "preview", label: "Contract Preview", icon: Eye },
    { id: "promoters", label: "Assign Promoters", icon: Users },
    { id: "review", label: "Review & Send", icon: CheckCircle2 }
  ];

  const getStepIndex = (step: string) => stepIndicators.findIndex(s => s.id === step);
  const currentStepIndex = getStepIndex(activeStep);
  const isLastStep = currentStepIndex === stepIndicators.length - 1;

  const handleNext = () => {
    if (validationErrors.length === 0) {
      const currentIndex = stepIndicators.findIndex(s => s.id === activeStep);
      if (currentIndex < stepIndicators.length - 1) {
        const nextStep = stepIndicators[currentIndex + 1].id as any;
        setActiveStep(nextStep);
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = stepIndicators.findIndex(s => s.id === activeStep);
    if (currentIndex > 0) {
      const prevStep = stepIndicators[currentIndex - 1].id as any;
      setActiveStep(prevStep);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Create Shift & Contract</CardTitle>
          <CardDescription>Professional shift creation with automated contract generation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {stepIndicators.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === activeStep;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                  <button
                    onClick={() => setActiveStep(step.id as any)}
                    disabled={index > currentStepIndex + 1}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                        : isCompleted
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                  <span className={`text-xs text-center ${isActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <div>
        {activeStep === "details" && (
          <ShiftDetailsStep
            formData={formData}
            onChange={handleDetailsChange}
            onNext={handleNext}
          />
        )}

        {activeStep === "payment" && (
          <PaymentScheduleStep
            formData={formData}
            paymentSchedule={paymentSchedule}
            onChange={handlePaymentChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}

        {activeStep === "preview" && (
          <ContractPreviewStep
            contractPreview={contractPreview}
            contractTitle={formData.contractTitle}
            contractBody={formData.contractBody}
            formData={formData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onContractChange={handleContractChange}
          />
        )}

        {activeStep === "promoters" && (
          <PromoterAssignmentStep
            formData={formData}
            onChange={handlePromoterChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}

        {activeStep === "review" && (
          <ContractReviewStep
            formData={formData}
            onPrevious={handlePrevious}
            onSubmit={submitShiftAndContract}
            isSubmitting={loading}
          />
        )}
      </div>
    </div>
  );
}

export default UnifiedShiftContractForm;
