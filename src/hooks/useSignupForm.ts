
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
  const { uploadFiles, updateUserProfile } = useSignupFileUpload(setUploadingFiles);

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
      console.log("Form data to submit:", formData);
      
      // Format phone number - if empty, make it explicitly null to avoid DB constraints
      const formattedData = {
        ...formData,
        phoneNumber: formData.phoneNumber?.trim() || null
      };
      
      const { fullName, email, password } = formattedData;
      
      console.log("Creating user with:", { fullName, email });
      const userData = await signup(fullName, email, password);
      
      if (!userData || !userData.id) {
        throw new Error("Failed to create user account");
      }
      
      console.log("User created successfully:", userData);
      
      try {
        // Upload files
        const { idCardUrl, profilePhotoUrl } = await uploadFiles(userData.id, fileData);
        console.log("Files uploaded:", { idCardUrl, profilePhotoUrl });
        
        // Update profile with properly handled phone number
        await updateUserProfile(userData.id, formattedData, idCardUrl || '', profilePhotoUrl || '');
        console.log("Profile updated successfully");
        
        setIsSuccess(true);
        toast({
          title: "Registration successful",
          description: "Your account is now pending verification.",
        });
        
        setTimeout(() => {
          navigate("/profile");
        }, 2000);
      } catch (profileError: any) {
        console.error("Profile creation error:", profileError);
        
        // Even if profile creation fails, the user has been created
        // Show success but with a warning
        setIsSuccess(true);
        toast({
          title: "Registration partially successful",
          description: "Your account was created, but there was an issue with your profile. Please complete your profile after login.",
          variant: "destructive",
        });
        
        setTimeout(() => {
          navigate("/profile");
        }, 3000);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
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
