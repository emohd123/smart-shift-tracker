
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
    handleChange
  } = useSignupFormState();
  
  const { handleFileChange } = useSignupFileHandling(setFileData);
  const { validateForm } = useSignupFormValidation(formData, fileData, setFormError);
  const { uploadFiles, updateUserProfile } = useSignupFileUpload(setUploadingFiles);

  const handleNextStep = () => {
    if (validateForm(step)) {
      setStep(prevStep => prevStep + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(prevStep => prevStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(step)) return;
    
    try {
      setFormError(null);
      
      const { fullName, email, password } = formData;
      const userData = await signup(fullName, email, password);
      
      if (!userData || !userData.id) {
        throw new Error("Failed to create user account");
      }
      
      const { idCardUrl, profilePhotoUrl } = await uploadFiles(userData.id, fileData);
      
      await updateUserProfile(userData.id, formData, idCardUrl || '', profilePhotoUrl || '');
      
      setIsSuccess(true);
      toast({
        title: "Registration successful",
        description: "Your account is now pending verification.",
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
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
    authError
  };
};
