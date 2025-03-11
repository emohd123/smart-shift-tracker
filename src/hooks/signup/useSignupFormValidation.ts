
import { FormData, FileData } from "@/components/auth/signup/types";

export const useSignupFormValidation = (
  formData: FormData, 
  fileData: FileData, 
  setFormError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const validateAccountInfo = () => {
    setFormError(null);
    
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setFormError("All fields are required");
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setFormError("Please enter a valid email address");
      return false;
    }
    
    if (formData.password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return false;
    }
    
    return true;
  };
  
  const validatePersonalInfo = () => {
    setFormError(null);
    
    if (
      !formData.nationality ||
      !formData.age ||
      !formData.phoneNumber ||
      !formData.gender ||
      !formData.height ||
      !formData.weight ||
      !formData.address
    ) {
      setFormError("All required fields must be filled");
      return false;
    }
    
    if (formData.gender !== 'Male' && formData.gender !== 'Female') {
      setFormError("Please select a gender");
      return false;
    }
    
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 18) {
      setFormError("You must be at least 18 years old");
      return false;
    }
    
    if (!/^\d+$/.test(formData.height) || !/^\d+$/.test(formData.weight)) {
      setFormError("Height and weight must be numeric values");
      return false;
    }
    
    return true;
  };
  
  const validateDocuments = () => {
    setFormError(null);
    
    if (!fileData.idCard) {
      setFormError("Please upload your ID card");
      return false;
    }
    
    if (!fileData.profilePhoto) {
      setFormError("Please upload your profile photo");
      return false;
    }
    
    return true;
  };
  
  const validateSection = (section: string) => {
    switch (section) {
      case "account":
        return validateAccountInfo();
      case "personal":
        return validatePersonalInfo();
      case "documents":
        return validateDocuments();
      default:
        return false;
    }
  };
  
  const validateForm = () => {
    // Validate all sections before submitting
    if (!validateAccountInfo()) return false;
    if (!validatePersonalInfo()) return false;
    if (!validateDocuments()) return false;
    
    return true;
  };

  return { validateForm, validateSection };
};
