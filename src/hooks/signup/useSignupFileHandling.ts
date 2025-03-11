
import { ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";

export const useSignupFileHandling = (setFileData: any) => {
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fileType: 'idCard' | 'profilePhoto') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB
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
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (fileType === 'idCard') {
        setFileData(prev => ({ 
          ...prev, 
          idCard: file,
          idCardPreview: file.type === 'application/pdf' 
            ? '/placeholder.svg' 
            : URL.createObjectURL(file)
        }));
      } else {
        setFileData(prev => ({ 
          ...prev,
          profilePhoto: file,
          profilePhotoPreview: URL.createObjectURL(file)
        }));
      }
    }
  };

  return { handleFileChange };
};
