
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSignupFormState } from "./signup/useSignupFormState";
import { useSignupFileHandling } from "./signup/useSignupFileHandling";
import { useSignupFormValidation } from "./signup/useSignupFormValidation";
import { useSignupFileUpload } from "./signup/useSignupFileUpload";
import { supabase } from "@/integrations/supabase/client";

export const useSignupForm = () => {
  const { signup, loading, authError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    formData,
    setFormData,
    fileData,
    setFileData,
    step,
    setStep,
    formError,
    setFormError,
    isSuccess,
    setIsSuccess,
    uploadingFiles,
    setUploadingFiles,
    handleChange,
    activeSection,
    setActiveSection,
    emailConfirmationRequired,
    setEmailConfirmationRequired
  } = useSignupFormState();

  const { handleFileChange, cleanupFilePreview } = useSignupFileHandling(setFileData);
  const { validateForm, validateSection } = useSignupFormValidation(formData, fileData, setFormError);
  const { uploadFiles, updateUserProfile, createCompanyProfile } = useSignupFileUpload(setUploadingFiles);

  const handleNextStep = () => {
    if (validateSection(activeSection)) {
      if (activeSection === "account") {
        setActiveSection("personal");
      } else if (activeSection === "personal") {
        setActiveSection("documents");
      }
    }
  };

  const handlePrevStep = () => {
    if (activeSection === "personal") {
      setActiveSection("account");
    } else if (activeSection === "documents") {
      setActiveSection("personal");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setFormError(null);

      const { fullName, email, password, role } = formData;

      // Step 1: Create user account
      const userData = await signup(fullName, email, password, role);

      if (!userData || !userData.id) {
        throw new Error("Failed to create user account");
      }

      // Check if email confirmation is required and update state
      const needsEmailConfirmation = userData.emailConfirmationRequired;
      setEmailConfirmationRequired(needsEmailConfirmation);

      // Step 2: Upload files (non-blocking) - only if we have a session (auto-login)
      let idCardUrl = null;
      let profilePhotoUrl = null;
      let companyLogoUrl = null;
      let businessDocumentUrl = null;
      let uploadErrors: string[] = [];

      const hasPromoterFiles = fileData.idCard || fileData.profilePhoto;
      const hasCompanyFiles = fileData.companyLogo || fileData.businessDocument;

      if ((hasPromoterFiles || hasCompanyFiles) && !needsEmailConfirmation) {
        const uploadResult = await uploadFiles(userData.id, fileData, role);

        if (role === 'company') {
          companyLogoUrl = uploadResult.companyLogoUrl || null;
          businessDocumentUrl = uploadResult.businessDocumentUrl || null;
        } else {
          idCardUrl = uploadResult.idCardUrl || null;
          profilePhotoUrl = uploadResult.profilePhotoUrl || null;
        }

        uploadErrors = uploadResult.errors || [];

        if (uploadErrors.length > 0) {
          console.warn("⚠️ File upload warnings:", uploadErrors);
          toast({
            title: "Files partially uploaded",
            description: "Some files couldn't be uploaded, but your account was created successfully.",
            variant: "default",
          });
        }
      }

      // If email confirmation is required, show success but don't navigate to dashboard
      if (needsEmailConfirmation) {
        setIsSuccess(true);
        toast({
          title: "Check your email! 📧",
          description: "We've sent you a confirmation link. Please check your email to complete registration.",
        });
        // Don't navigate - let user see the RegistrationSuccess component
        return;
      }

      // Step 3: Update profile and create company profile if needed (only if auto-logged in)
      try {
        if (role === 'company') {
          // Create company profile
          await createCompanyProfile(userData.id, formData, companyLogoUrl);
        }

        // Update user profile
        await updateUserProfile(userData.id, formData, idCardUrl, profilePhotoUrl, role);

        // Auto-generate unique code for promoters
        if (role === 'promoter') {
          try {
            const { data: codeData, error: codeError } = await supabase.functions.invoke('generate-unique-code');

            if (codeError) {
              console.warn("⚠️ Could not generate unique code during signup:", codeError);
              // Non-blocking: user can generate code later from profile
            }
          } catch (codeGenError) {
            console.warn("⚠️ Code generation error (non-blocking):", codeGenError);
            // Non-blocking: user can generate code later from profile
          }
        }

        setIsSuccess(true);
        toast({
          title: "Registration successful! 🎉",
          description: role === 'company' ? "Redirecting to your company dashboard..." : "Redirecting to your dashboard...",
        });

        // Navigate after a short delay to let user see the success message
        setTimeout(() => {
          navigate(role === 'company' ? "/company" : "/dashboard");
        }, 1500);
      } catch (profileError: any) {
        console.error("❌ Profile update error:", profileError);

        // Account was created, just couldn't update extended profile
        setIsSuccess(true);
        toast({
          title: "Account created",
          description: role === 'company' ? "Redirecting to company dashboard. You can complete your profile later." : "Redirecting to dashboard. You can complete your profile later.",
          variant: "default",
        });

        setTimeout(() => {
          navigate(role === 'company' ? "/company" : "/dashboard");
        }, 1500);
      }
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      setFormError(error.message || "Registration failed. Please try again.");
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  return {
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
    authError,
    activeSection,
    setActiveSection,
    emailConfirmationRequired
  };
};
