
import { FormData, FileData } from "@/components/auth/signup/types";
import { sanitizeInput, emailSchema, passwordSchema, nameSchema, phoneSchema, containsSqlInjection, useInputValidation } from "@/utils/validation";
import { validateIBAN } from "@/utils/ibanValidation";

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
  
  const validateCompanyInfo = () => {
    setFormError(null);
    
    if (!formData.companyName || !formData.address) {
      setFormError("Company name and address are required");
      return false;
    }
    
    // Sanitize text inputs
    const sanitizedCompanyName = sanitizeInput(formData.companyName.trim());
    const sanitizedAddress = sanitizeInput(formData.address.trim());
    const sanitizedWebsite = formData.companyWebsite ? sanitizeInput(formData.companyWebsite.trim()) : '';
    const sanitizedPhone = formData.phoneNumber ? sanitizeInput(formData.phoneNumber.trim()) : '';
    
    // Check for SQL injection attempts
    if (containsSqlInjection(sanitizedCompanyName) || 
        containsSqlInjection(sanitizedAddress) ||
        (sanitizedWebsite && containsSqlInjection(sanitizedWebsite)) ||
        (sanitizedPhone && containsSqlInjection(sanitizedPhone))) {
      setFormError("Invalid characters detected in company information");
      return false;
    }
    
    // Validate company name
    if (sanitizedCompanyName.length < 2 || sanitizedCompanyName.length > 100) {
      setFormError("Company name must be between 2 and 100 characters");
      return false;
    }
    
    // Validate address
    if (sanitizedAddress.length < 10) {
      setFormError("Please provide a complete address");
      return false;
    }
    
    // Validate website URL if provided
    if (sanitizedWebsite) {
      try {
        new URL(sanitizedWebsite);
      } catch {
        setFormError("Please enter a valid website URL (e.g., https://example.com)");
        return false;
      }
    }
    
    // Validate phone number if provided
    if (sanitizedPhone) {
      const phoneValidation = validateInput(sanitizedPhone, phoneSchema);
      if (!phoneValidation.isValid) {
        setFormError(phoneValidation.error || "Invalid phone number format");
        return false;
      }
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
  
  const validateBankAccount = () => {
    setFormError(null);
    
    // Only validate for promoters
    if (formData.role === 'company') {
      return true;
    }
    
    // Check required fields
    if (!formData.bankAccountHolderName || !formData.ibanNumber || !formData.bankName || !formData.bankCountry) {
      setFormError("All bank account fields are required");
      return false;
    }
    
    // Sanitize inputs
    const sanitizedHolderName = sanitizeInput(formData.bankAccountHolderName.trim());
    const sanitizedBankName = sanitizeInput(formData.bankName.trim());
    
    // Check for SQL injection attempts
    if (containsSqlInjection(sanitizedHolderName) || containsSqlInjection(sanitizedBankName)) {
      setFormError("Invalid characters detected in bank account information");
      return false;
    }
    
    // Validate account holder name
    if (sanitizedHolderName.length < 2 || sanitizedHolderName.length > 100) {
      setFormError("Account holder name must be between 2 and 100 characters");
      return false;
    }
    
    // Validate bank name
    if (sanitizedBankName.length < 2 || sanitizedBankName.length > 100) {
      setFormError("Bank name must be between 2 and 100 characters");
      return false;
    }
    
    // Validate IBAN
    const ibanValidation = validateIBAN(formData.ibanNumber || '');
    if (!ibanValidation.valid) {
      setFormError(ibanValidation.error || "Invalid IBAN format");
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
        return formData.role === 'company' ? validateCompanyInfo() : validatePersonalInfo();
      case "bank":
        return validateBankAccount();
      case "documents":
        return validateDocuments();
      default:
        return false;
    }
  };
  
  const validateForm = () => {
    // Validate required sections before submitting
    if (!validateAccountInfo()) return false;
    
    // Validate role-specific information
    if (formData.role === 'company') {
      if (!validateCompanyInfo()) return false;
    } else {
      if (!validatePersonalInfo()) return false;
      // Validate bank account for promoters
      if (!validateBankAccount()) return false;
    }
    
    // Documents are optional, so we don't need to validate them
    
    return true;
  };

  return { validateForm, validateSection };
};
