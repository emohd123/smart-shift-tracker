
import { GenderType, UserRole } from "@/types/database";

export interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  nationality: string;
  age: string;
  phoneNumber: string;
  gender: GenderType;
  height: string;
  weight: string;
  isStudent: boolean;
  address: string;
  bankDetails: string;
  role: UserRole; // 'promoter' or 'company' at signup
  
  // Company-specific fields
  companyName?: string;
  companyRegistrationId?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companySize?: string;
  companyDescription?: string;
}

export interface FileData {
  idCard: File | null;
  profilePhoto: File | null;
  idCardPreview: string | null;
  profilePhotoPreview: string | null;
  
  // Company-specific files
  companyLogo?: File | null;
  companyLogoPreview?: string | null;
  businessDocument?: File | null;
  businessDocumentPreview?: string | null;
}
