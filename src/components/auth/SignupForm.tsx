
import { useSignupForm } from "@/hooks/useSignupForm";
import { Clock, ArrowLeft, Home, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountInfoStep } from "./signup/AccountInfoStep";
import { PersonalInfoStep } from "./signup/PersonalInfoStep";
import { DocumentUploadStep } from "./signup/DocumentUploadStep";
import { RegistrationSuccess } from "./signup/RegistrationSuccess";

interface SignupFormProps {
  onBack?: () => void;
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function SignupForm({ onBack, onSuccess, isModal = false }: SignupFormProps) {
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
    setFileData,
    activeSection,
    setActiveSection
  } = useSignupForm();

  if (isSuccess) {
    return (
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Clock className="text-white" size={20} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome to SmartShift!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your part-timer account has been created successfully
          </p>
        </div>
        <RegistrationSuccess />
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
          <Clock className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Create Part-timer Account</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Register to start tracking your shifts and hours
        </p>
      </div>

      {formError && (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="account">Account Info</TabsTrigger>
              <TabsTrigger value="personal">Personal Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account" className="space-y-4">
              <AccountInfoStep
                formData={formData}
                handleChange={handleChange}
              />
              <div className="flex justify-between mt-4">
                <div className="flex space-x-2">
                  {isModal && onBack ? (
                    <Button type="button" variant="outline" onClick={onBack}>
                      <ArrowLeft size={16} className="mr-2" />
                      Back to Role Selection
                    </Button>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                <Button type="button" onClick={() => setActiveSection("personal")}>
                  Next
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="personal" className="space-y-4">
              <PersonalInfoStep
                formData={formData}
                handleChange={handleChange}
                setFormData={(newData) => {
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
              <div className="flex justify-between mt-4">
                <Button type="button" variant="outline" onClick={() => setActiveSection("account")}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveSection("documents")}>
                  Next
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              <DocumentUploadStep
                fileData={fileData}
                handleFileChange={handleFileChange}
                setIdCard={(file) => setFileData(prev => ({ ...prev, idCard: file }))}
                setIdCardPreview={(preview) => setFileData(prev => ({ ...prev, idCardPreview: preview }))}
                setProfilePhoto={(file) => setFileData(prev => ({ ...prev, profilePhoto: file }))}
                setProfilePhotoPreview={(preview) => setFileData(prev => ({ ...prev, profilePhotoPreview: preview }))}
              />
              <div className="flex justify-between mt-4">
                <Button type="button" variant="outline" onClick={() => setActiveSection("personal")}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    variant="outline"
                    disabled={loading || uploadingFiles}
                  >
                    {loading || uploadingFiles ? "Processing..." : "Skip & Complete"}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || uploadingFiles}
                    className="gap-2"
                  >
                    {loading || uploadingFiles ? "Processing..." : (
                      <>
                        <Save size={16} />
                        Complete Registration
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
}
