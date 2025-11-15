
import { ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { FileData } from "@/components/auth/signup/types";

export const useSignupFileHandling = (setFileData: React.Dispatch<React.SetStateAction<FileData>>) => {
  const { toast } = useToast();

  const validateFile = (file: File, fileType: 'idCard' | 'profilePhoto' | 'companyLogo' | 'businessDocument'): { valid: boolean; error?: string } => {
    const maxSize = (fileType === 'companyLogo' || fileType === 'profilePhoto') ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    const allowedTypes = (fileType === 'companyLogo' || fileType === 'profilePhoto')
      ? ['image/jpeg', 'image/png', 'image/webp'] 
      : ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: (fileType === 'companyLogo' || fileType === 'profilePhoto')
          ? "Please upload a JPEG, PNG, or WEBP file" 
          : "Please upload a JPEG, PNG, or PDF file"
      };
    }
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `Please upload a file smaller than ${maxSize / (1024 * 1024)}MB`
      };
    }
    
    return { valid: true };
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fileType: 'idCard' | 'profilePhoto' | 'companyLogo' | 'businessDocument') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const validation = validateFile(file, fileType);
      
      if (!validation.valid) {
        toast({
          title: fileType === 'idCard' ? "Invalid ID Card" : 
                 fileType === 'profilePhoto' ? "Invalid Profile Photo" :
                 fileType === 'companyLogo' ? "Invalid Company Logo" :
                 "Invalid Document",
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
        } else if (fileType === 'profilePhoto') {
          setFileData(prev => ({ 
            ...prev,
            profilePhoto: file,
            profilePhotoPreview: URL.createObjectURL(file)
          }));
        } else if (fileType === 'companyLogo') {
          setFileData(prev => ({ 
            ...prev,
            companyLogo: file,
            companyLogoPreview: URL.createObjectURL(file)
          }));
        } else if (fileType === 'businessDocument') {
          const preview = file.type === 'application/pdf' 
            ? '/placeholder.svg' 
            : URL.createObjectURL(file);
            
          setFileData(prev => ({ 
            ...prev,
            businessDocument: file,
            businessDocumentPreview: preview
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
    
    if (fileData.companyLogoPreview) {
      URL.revokeObjectURL(fileData.companyLogoPreview);
    }
    
    if (fileData.businessDocumentPreview && fileData.businessDocumentPreview !== '/placeholder.svg') {
      URL.revokeObjectURL(fileData.businessDocumentPreview);
    }
  };

  return { handleFileChange, cleanupFilePreview };
};
