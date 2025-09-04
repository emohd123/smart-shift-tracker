
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
  role: UserRole; // 'part_timer' or 'company_admin' at signup
}

export interface FileData {
  idCard: File | null;
  profilePhoto: File | null;
  idCardPreview: string | null;
  profilePhotoPreview: string | null;
}
