
import { ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { FileData } from "@/components/auth/signup/types";

export const useSignupFileHandling = (setFileData: React.Dispatch<React.SetStateAction<FileData>>) => {
  const { toast } = useToast();

  const validateFile = (file: File, fileType: 'idCard' | 'profilePhoto'): { valid: boolean; error?: string } => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = fileType === 'idCard' 
      ? ['image/jpeg', 'image/png', 'application/pdf'] 
      : ['image/jpeg', 'image/png'];
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: fileType === 'idCard' 
          ? "Please upload a JPEG, PNG, or PDF file" 
          : "Please upload a JPEG or PNG file"
      };
    }
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: "Please upload a file smaller than 5MB"
      };
    }
    
    return { valid: true };
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fileType: 'idCard' | 'profilePhoto') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const validation = validateFile(file, fileType);
      
      if (!validation.valid) {
        toast({
          title: fileType === 'idCard' ? "Invalid ID Card" : "Invalid Profile Photo",
          description: validation.error,
          variant: "destructive",
        });
        return;
      }
      
      try {
        if (fileType === 'idCard') {
          const preview = file.type === 'application/pdf' 
            ? '/placeholder.svg' 
            : URL.createObjectURL(file);
            
          setFileData(prev => ({ 
            ...prev, 
            idCard: file,
            idCardPreview: preview
          }));
        } else {
          setFileData(prev => ({ 
            ...prev,
            profilePhoto: file,
            profilePhotoPreview: URL.createObjectURL(file)
          }));
        }
      } catch (error) {
        console.error(`Error creating object URL for ${fileType}:`, error);
        toast({
          title: "Preview error",
          description: `Could not generate preview for ${fileType === 'idCard' ? 'ID Card' : 'Profile Photo'}`,
          variant: "destructive",
        });
      }
    }
  };

  // Helper function to clean up object URLs to prevent memory leaks
  const cleanupFilePreview = (fileData: FileData) => {
    if (fileData.idCardPreview && fileData.idCardPreview !== '/placeholder.svg') {
      URL.revokeObjectURL(fileData.idCardPreview);
    }
    
    if (fileData.profilePhotoPreview) {
      URL.revokeObjectURL(fileData.profilePhotoPreview);
    }
  };

  return { handleFileChange, cleanupFilePreview };
};
