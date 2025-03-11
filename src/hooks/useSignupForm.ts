
import { useState, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FormData, FileData } from "@/components/auth/signup/types";

export const useSignupForm = () => {
  const { signup, loading, authError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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
  
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checkbox.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fileType: 'idCard' | 'profilePhoto') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = fileType === 'idCard' 
        ? ['image/jpeg', 'image/png', 'application/pdf'] 
        : ['image/jpeg', 'image/png'];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: fileType === 'idCard' 
            ? "Please upload a JPEG, PNG, or PDF file" 
            : "Please upload a JPEG or PNG file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (fileType === 'idCard') {
        setFileData(prev => ({ ...prev, idCard: file }));
        
        if (file.type === 'application/pdf') {
          setFileData(prev => ({ 
            ...prev, 
            idCard: file, 
            idCardPreview: '/placeholder.svg' 
          }));
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFileData(prev => ({ 
              ...prev, 
              idCard: file, 
              idCardPreview: e.target?.result as string 
            }));
          };
          reader.readAsDataURL(file);
        }
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFileData(prev => ({ 
            ...prev, 
            profilePhoto: file, 
            profilePhotoPreview: e.target?.result as string 
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const validateForm = () => {
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

  const handleNextStep = () => {
    if (validateForm()) {
      setStep(prevStep => prevStep + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(prevStep => prevStep - 1);
  };

  const uploadFiles = async (userId: string) => {
    try {
      setUploadingFiles(true);
      let idCardUrl = null;
      let profilePhotoUrl = null;
      
      const { data: buckets } = await supabase.storage.listBuckets();
      
      if (!buckets?.find(b => b.name === 'id_cards')) {
        await supabase.storage.createBucket('id_cards', {
          public: true
        });
      }
      
      if (!buckets?.find(b => b.name === 'profile_photos')) {
        await supabase.storage.createBucket('profile_photos', {
          public: true
        });
      }
      
      if (fileData.idCard) {
        const fileExt = fileData.idCard.name.split('.').pop();
        const fileName = `${userId}/id_card.${fileExt}`;
        
        const { data: idCardData, error: idCardError } = await supabase.storage
          .from('id_cards')
          .upload(fileName, fileData.idCard);
          
        if (idCardError) throw idCardError;
        idCardUrl = `${fileName}`;
      }
      
      if (fileData.profilePhoto) {
        const fileExt = fileData.profilePhoto.name.split('.').pop();
        const fileName = `${userId}/profile_photo.${fileExt}`;
        
        const { data: profilePhotoData, error: profilePhotoError } = await supabase.storage
          .from('profile_photos')
          .upload(fileName, fileData.profilePhoto);
          
        if (profilePhotoError) throw profilePhotoError;
        profilePhotoUrl = `${fileName}`;
      }
      
      return { idCardUrl, profilePhotoUrl };
    } catch (error: any) {
      console.error("Error uploading files:", error);
      throw error;
    } finally {
      setUploadingFiles(false);
    }
  };

  const updateUserProfile = async (userId: string, idCardUrl: string, profilePhotoUrl: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          nationality: formData.nationality,
          age: parseInt(formData.age),
          phone_number: formData.phoneNumber,
          gender: formData.gender as any,
          height: parseInt(formData.height),
          weight: parseInt(formData.weight),
          is_student: formData.isStudent,
          address: formData.address,
          bank_details: formData.bankDetails || null,
          id_card_url: idCardUrl,
          profile_photo_url: profilePhotoUrl,
          verification_status: 'pending'
        })
        .eq('id', userId);
        
      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setFormError(null);
      
      const { fullName, email, password } = formData;
      const userData = await signup(fullName, email, password);
      
      if (!userData || !userData.id) {
        throw new Error("Failed to create user account");
      }
      
      const { idCardUrl, profilePhotoUrl } = await uploadFiles(userData.id);
      
      await updateUserProfile(userData.id, idCardUrl || '', profilePhotoUrl || '');
      
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
    setFormError,
    handleSubmit,
    isSuccess,
    loading,
    uploadingFiles,
    setFileData,
    authError
  };
};
