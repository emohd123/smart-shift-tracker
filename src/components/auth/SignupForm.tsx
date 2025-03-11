
import { useSignupForm } from "@/hooks/useSignupForm";
import { Clock, ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AccountInfoStep } from "./signup/AccountInfoStep";
import { PersonalInfoStep } from "./signup/PersonalInfoStep";
import { DocumentUploadStep } from "./signup/DocumentUploadStep";
import { StepIndicator } from "./signup/StepIndicator";
import { RegistrationSuccess } from "./signup/RegistrationSuccess";

export default function SignupForm() {
  const {
    formData,
    fileData,
    handleChange,
    handleFileChange,
    step,
    handleNextStep,
    handlePrevStep,
    formError,
    handleSubmit,
    isSuccess,
    loading,
    uploadingFiles,
    setFileData
  } = useSignupForm();

  return (
    <div className="w-full max-w-2xl space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
          <Clock className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Create Your Account</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Register to start your journey as a promoter
        </p>
      </div>

      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {isSuccess ? (
        <RegistrationSuccess />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <StepIndicator currentStep={step} totalSteps={3} />

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <AccountInfoStep
                formData={formData}
                handleChange={handleChange}
              />
            )}

            {step === 2 && (
              <PersonalInfoStep
                formData={formData}
                handleChange={handleChange}
                setFormData={(newData) => {
                  // We call setFormData from the hook indirectly through handleChange
                  Object.entries(newData).forEach(([key, value]) => {
                    const syntheticEvent = {
                      target: {
                        name: key,
                        value,
                        type: typeof value === 'boolean' ? 'checkbox' : 'text',
                        checked: Boolean(value)
                      }
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleChange(syntheticEvent);
                  });
                }}
              />
            )}

            {step === 3 && (
              <DocumentUploadStep
                fileData={fileData}
                handleFileChange={handleFileChange}
                setIdCard={(file) => setFileData(prev => ({ ...prev, idCard: file }))}
                setIdCardPreview={(preview) => setFileData(prev => ({ ...prev, idCardPreview: preview }))}
                setProfilePhoto={(file) => setFileData(prev => ({ ...prev, profilePhoto: file }))}
                setProfilePhotoPreview={(preview) => setFileData(prev => ({ ...prev, profilePhotoPreview: preview }))}
              />
            )}

            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={loading || uploadingFiles}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/login">
                    <Button type="button" variant="outline">
                      <ArrowLeft size={16} className="mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button type="button" variant="outline">
                      <Home size={16} className="mr-2" />
                      Home
                    </Button>
                  </Link>
                </div>
              )}

              {step < 3 ? (
                <Button type="button" onClick={handleNextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading || uploadingFiles}>
                  {loading || uploadingFiles ? "Processing..." : "Complete Registration"}
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
