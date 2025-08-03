
import { FormData, FileData } from "@/components/auth/signup/types";
import { sanitizeInput, emailSchema, passwordSchema, nameSchema, phoneSchema, containsSqlInjection, useInputValidation } from "@/utils/validation";

export const useSignupFormValidation = (
  formData: FormData, 
  fileData: FileData, 
  setFormError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const { validateInput } = useInputValidation();
  
  const validateAccountInfo = () => {
    setFormError(null);
    
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setFormError("All fields are required");
      return false;
    }
    
    // Sanitize and validate inputs
    const sanitizedFullName = sanitizeInput(formData.fullName.trim());
    const sanitizedEmail = sanitizeInput(formData.email.trim());
    
    // Check for SQL injection attempts
    if (containsSqlInjection(sanitizedFullName) || containsSqlInjection(sanitizedEmail)) {
      setFormError("Invalid characters detected. Please use only standard characters.");
      return false;
    }
    
    // Validate full name
    const nameValidation = validateInput(sanitizedFullName, nameSchema);
    if (!nameValidation.isValid) {
      setFormError(nameValidation.error || "Invalid name format");
      return false;
    }
    
    // Validate email
    const emailValidation = validateInput(sanitizedEmail, emailSchema);
    if (!emailValidation.isValid) {
      setFormError(emailValidation.error || "Invalid email format");
      return false;
    }
    
    // Validate password strength
    const passwordValidation = validateInput(formData.password, passwordSchema);
    if (!passwordValidation.isValid) {
      setFormError(passwordValidation.error || "Password does not meet security requirements");
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
    
    // Sanitize text inputs
    const sanitizedNationality = sanitizeInput(formData.nationality.trim());
    const sanitizedAddress = sanitizeInput(formData.address.trim());
    const sanitizedPhoneNumber = formData.phoneNumber ? sanitizeInput(formData.phoneNumber.trim()) : '';
    
    // Check for SQL injection attempts
    if (containsSqlInjection(sanitizedNationality) || 
        containsSqlInjection(sanitizedAddress) || 
        (sanitizedPhoneNumber && containsSqlInjection(sanitizedPhoneNumber))) {
      setFormError("Invalid characters detected in personal information");
      return false;
    }
    
    // Validate age
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 18 || age > 120) {
      setFormError("Age must be between 18 and 120 years");
      return false;
    }
    
    // Validate height and weight
    const height = parseInt(formData.height);
    const weight = parseInt(formData.weight);
    
    if (isNaN(height) || height < 100 || height > 250) {
      setFormError("Height must be between 100 and 250 cm");
      return false;
    }
    
    if (isNaN(weight) || weight < 30 || weight > 300) {
      setFormError("Weight must be between 30 and 300 kg");
      return false;
    }
    
    // Validate phone number if provided
    if (sanitizedPhoneNumber) {
      const phoneValidation = validateInput(sanitizedPhoneNumber, phoneSchema);
      if (!phoneValidation.isValid) {
        setFormError(phoneValidation.error || "Invalid phone number format");
        return false;
      }
    }
    
    // Basic validation for address length
    if (sanitizedAddress.length < 10) {
      setFormError("Please provide a more complete address");
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
