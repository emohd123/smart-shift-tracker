
import { useState, ChangeEvent } from "react";
import { FormData, FileData } from "@/components/auth/signup/types";

export const useSignupFormState = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    nationality: "",
    age: "",
    phoneNumber: "",
    gender: "",
    height: "",
    weight: "",
    isStudent: false,
    address: "",
    bankDetails: "",
  });
  
  const [fileData, setFileData] = useState<FileData>({
    idCard: null,
    profilePhoto: null,
    idCardPreview: null,
    profilePhotoPreview: null,
  });
  
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("account");

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
    setActiveSection
  };
};
