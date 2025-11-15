
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSignupFormState } from "./signup/useSignupFormState";
import { useSignupFileHandling } from "./signup/useSignupFileHandling";
import { useSignupFormValidation } from "./signup/useSignupFormValidation";
import { useSignupFileUpload } from "./signup/useSignupFileUpload";

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
    setActiveSection
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
      console.log("🚀 Starting signup process...");
      
      const { fullName, email, password, role } = formData;
      
      // Step 1: Create user account
      console.log("📝 Creating account for:", email);
      const userData = await signup(fullName, email, password, role);
      
      if (!userData || !userData.id) {
        throw new Error("Failed to create user account");
      }
      
      console.log("✓ Account created:", userData.id);
      
      // Step 2: Upload files (non-blocking)
      let idCardUrl = null;
      let profilePhotoUrl = null;
      let companyLogoUrl = null;
      let businessDocumentUrl = null;
      let uploadErrors: string[] = [];
      
      const hasPromoterFiles = fileData.idCard || fileData.profilePhoto;
      const hasCompanyFiles = fileData.companyLogo || fileData.businessDocument;
      
      if (hasPromoterFiles || hasCompanyFiles) {
        console.log("📤 Uploading files...");
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
        } else if (companyLogoUrl || businessDocumentUrl || idCardUrl || profilePhotoUrl) {
          console.log("✓ Files uploaded successfully");
        }
      }
      
      // Step 3: Update profile and create company profile if needed
      try {
        console.log("💾 Updating profile...");
        
        if (role === 'company') {
          // Create company profile
          await createCompanyProfile(userData.id, formData, companyLogoUrl);
          console.log("✓ Company profile created");
        }
        
        // Update user profile
        await updateUserProfile(userData.id, formData, idCardUrl, profilePhotoUrl, role);
        console.log("✓ Profile updated successfully");
        
        setIsSuccess(true);
        toast({
          title: "Registration successful! 🎉",
          description: "Your account has been created. You can now log in.",
        });
        
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (profileError: any) {
        console.error("❌ Profile update error:", profileError);
        
        // Account was created, just couldn't update extended profile
        setIsSuccess(true);
        toast({
          title: "Account created",
          description: "Please complete your profile after logging in.",
          variant: "default",
        });
        
        setTimeout(() => {
          navigate("/login");
        }, 2500);
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
    setActiveSection
  };
};
