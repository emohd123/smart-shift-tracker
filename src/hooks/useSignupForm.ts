
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
      
      // Always ensure phone number is null if empty
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
        
        // Update profile
        await updateUserProfile(userData.id, formattedData, idCardUrl || null, profilePhotoUrl || null);
        console.log("Profile updated successfully");
        
        setIsSuccess(true);
        
        // Determine role-specific message and navigation
        const userRole = formattedData.role || 'part_timer';
        const isPromoter = userRole === 'part_timer';
        
        toast({
          title: "Registration successful",
          description: isPromoter 
            ? "Welcome to SmartShift, Promoter! Your unique code is ready." 
            : "Welcome to SmartShift! Setting up your dashboard.",
        });
        
        // Auto login the user after successful registration
        try {
          const { fullName, email, password } = formattedData;
          await login(email, password);
          
          // Navigate to dashboard after login
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000); // Longer delay to show success message and unique code
          
        } catch (loginError) {
          console.error("Auto-login failed:", loginError);
          // If auto-login fails, still show success but redirect to login
          setTimeout(() => {
            navigate("/login", { 
              state: { 
                message: "Registration successful! Please log in with your new account.",
                email: formattedData.email 
              }
            });
          }, 2000);
        }
      } catch (profileError: unknown) {
        console.error("Profile creation error:", profileError);
        const errorMessage = profileError instanceof Error ? profileError.message : "Unknown error occurred";
        
        // Even if profile update fails, the user has been created and should have a basic profile
        // Show success but with a warning
        setIsSuccess(true);
        toast({
          title: "Registration partially successful",
          description: "Your account was created, but there was an issue with your profile. Please complete your profile after login.",
          variant: "destructive",
        });
        
        // Try to auto-login even if profile creation had issues
        try {
          const { fullName, email, password } = formattedData;
          await login(email, password);
        } catch (loginError) {
          console.error("Auto-login failed after partial registration:", loginError);
        }
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 2500);
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      setFormError(errorMessage);
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
