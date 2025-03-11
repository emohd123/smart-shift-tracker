
export const useSignupFormValidation = (formData: any, fileData: any, setFormError: any) => {
  const validateForm = (step: number) => {
    setFormError(null);
    
    if (step === 1) {
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
    } else if (step === 2) {
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
    } else if (step === 3) {
      if (!fileData.idCard) {
        setFormError("Please upload your ID card");
        return false;
      }
      
      if (!fileData.profilePhoto) {
        setFormError("Please upload your profile photo");
        return false;
      }
      
      return true;
    }
    
    return false;
  };

  return { validateForm };
};
