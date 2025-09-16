import { GenderType } from "./database";

export interface PersonalInfoFormData {
  nationality: string;
  age: string;
  phoneNumber?: string;
  gender: GenderType;
  height: string;
  weight: string;
  address: string;
  bankDetails?: string;
  isStudent?: boolean;
}

export interface ProfileFormData {
  unique_code?: string;
  full_name: string;
  nationality: string;
  age: number;
  phone_number?: string;
  gender: GenderType;
  height?: number;
  weight?: number;
  address: string;
  bank_details?: string;
  is_student?: boolean;
  email?: string;
}

export interface SignupFormData extends PersonalInfoFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName?: string;
  position?: string;
  experience?: string;
  skills?: string[];
  availability?: string;
  portfolio?: string;
  rates?: string;
  location?: string;
  profileImage?: File;
  preferredWorkType?: string;
  languages?: string[];
  certifications?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingOptIn?: boolean;
}

export type FormChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;

export type FormDataSetter<T> = (data: T) => void;