import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { useCompanySignupForm } from "@/hooks/useCompanySignupForm";
import { CompanyAccountInfoStep } from "./CompanyAccountInfoStep";
import { CompanyDetailsStep } from "./CompanyDetailsStep";
import { CompanyAssetsStep } from "./CompanyAssetsStep";
import { RegistrationSuccess } from "./RegistrationSuccess";

interface CompanySignupFlowProps {
  onBack: () => void;
  onSuccess: () => void;
}


import { useEffect } from "react";

export function CompanySignupFlow({ onBack, onSuccess }: CompanySignupFlowProps) {
  const {
    formData,
    fileData,
    handleChange,
    handleFileChange,
    formError,
    handleSubmit,
    isSuccess,
    loading,
    uploadingFiles,
    setFileData,
    activeSection,
    setActiveSection
  } = useCompanySignupForm();

  // Scroll to error when formError changes
  useEffect(() => {
    if (formError) {
      const anchor = document.getElementById('form-error-anchor');
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [formError]);

  if (isSuccess) {
    return (
      <div className="w-full max-w-2xl space-y-6 p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mb-3">
            <Building2 className="text-white" size={20} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome to SmartShift</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your company account has been created successfully
          </p>
        </div>
        <RegistrationSuccess />
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Redirecting to your company dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mb-3">
          <Building2 className="text-white" size={20} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Create Company Account</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Set up your company profile to start managing shifts
        </p>
      </div>

      <div id="form-error-anchor">
        {formError && (
          <Alert variant="destructive" className="text-sm">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="account">Account Info</TabsTrigger>
              <TabsTrigger value="company">Company Details</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account" className="space-y-4">
              <CompanyAccountInfoStep
                formData={formData}
                handleChange={handleChange}
              />
              <div className="flex justify-between mt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Role Selection
                </Button>
                <Button type="button" onClick={() => setActiveSection("company")}>
                  Next
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="company" className="space-y-4">
              <CompanyDetailsStep
                formData={formData}
                handleChange={handleChange}
              />
              <div className="flex justify-between mt-4">
                <Button type="button" variant="outline" onClick={() => setActiveSection("account")}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveSection("assets")}>
                  Next
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="assets" className="space-y-4">
              <CompanyAssetsStep
                fileData={fileData}
                handleFileChange={handleFileChange}
                setLogoFile={(file) => setFileData(prev => ({ ...prev, companyLogo: file }))}
                setLogoPreview={(preview) => setFileData(prev => ({ ...prev, companyLogoPreview: preview }))}
                setBusinessDoc={(file) => setFileData(prev => ({ ...prev, businessDocument: file }))}
                setBusinessDocPreview={(preview) => setFileData(prev => ({ ...prev, businessDocumentPreview: preview }))}
              />
              <div className="flex justify-between mt-4">
                <Button type="button" variant="outline" onClick={() => setActiveSection("company")}>
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