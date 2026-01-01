
import { useState, ChangeEvent, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FormData, FileData } from "@/components/auth/signup/types";
import { GenderType, UserRole } from "@/types/database";

export const useSignupFormState = () => {
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    nationality: "",
    age: "",
    phoneNumber: "",
    gender: GenderType.Male,  // Set default gender using the enum
    height: "",
    weight: "",
    isStudent: false,
    address: "",
    bankDetails: "",
    role: roleFromUrl === 'company' ? UserRole.Company : UserRole.Promoter,
    
    // Company-specific fields
    companyName: "",
    companyRegistrationId: "",
    companyWebsite: "",
    companyIndustry: "",
    companySize: "",
    companyDescription: "",
  });

  // Update role when URL parameter changes
  useEffect(() => {
    if (roleFromUrl === 'company') {
      setFormData(prev => ({ ...prev, role: UserRole.Company }));
    } else if (roleFromUrl === 'promoter') {
      setFormData(prev => ({ ...prev, role: UserRole.Promoter }));
    }
  }, [roleFromUrl]);
  
  const [fileData, setFileData] = useState<FileData>({
    idCard: null,
    profilePhoto: null,
    idCardPreview: null,
    profilePhotoPreview: null,
    
    // Company-specific files
    companyLogo: null,
    companyLogoPreview: null,
    businessDocument: null,
    businessDocumentPreview: null,
  });
  
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("account");
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checkbox.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return {
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
  };
};
