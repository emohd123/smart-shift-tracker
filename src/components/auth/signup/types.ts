
import { GenderType } from "@/types/database";

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
}

export interface FileData {
  idCard: File | null;
  profilePhoto: File | null;
  idCardPreview: string | null;
  profilePhotoPreview: string | null;
}
