
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex justify-between mb-6">
      <div className="flex space-x-2">
        {Array.from({ length: totalSteps }, (_, index) => index + 1).map((step) => (
          <div
            key={step}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === step
                ? "bg-primary text-white"
                : currentStep > step
                ? "bg-primary/20 text-primary"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-500">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
}
