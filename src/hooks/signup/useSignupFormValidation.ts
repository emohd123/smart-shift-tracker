
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
      !formData.gender ||
      !formData.height ||
      !formData.weight ||
      !formData.address
    ) {
      setFormError("All required fields must be filled");
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
    
    // Phone number is optional now
    if (formData.phoneNumber && !/^\+?[\d\s-]{10,15}$/.test(formData.phoneNumber.trim())) {
      setFormError("Please enter a valid phone number or leave it empty");
      return false;
    }
    
    return true;
  };
  
  const validateDocuments = () => {
    setFormError(null);
    
    // Documents are now optional - always return true
    // Users can upload documents later from their profile
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
    // Validate required sections before submitting
    if (!validateAccountInfo()) return false;
    if (!validatePersonalInfo()) return false;
    // Documents are optional, so we don't need to validate them
    
    return true;
  };

  return { validateForm, validateSection };
};
