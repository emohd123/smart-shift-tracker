
// Database enumerated types for frontend use
// These should match the enum types defined in Supabase

export enum GenderType {
  Male = "Male",
  Female = "Female",
  Other = "Other"
}

export enum VerificationStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected"
}

export enum ShiftStatus {
  Upcoming = "upcoming",
  Ongoing = "ongoing",
  Completed = "completed",
  Cancelled = "cancelled"
}

export enum UserRole {
  Admin = "admin",
  PartTimer = "part_timer", 
  CompanyAdmin = "company_admin",
  CompanyManager = "company_manager"
}

// Type guards for runtime type checking
export const isValidGender = (value: any): value is GenderType => 
  Object.values(GenderType).includes(value as GenderType);

export const isValidVerificationStatus = (value: any): value is VerificationStatus => 
  Object.values(VerificationStatus).includes(value as VerificationStatus);

export const isValidShiftStatus = (value: any): value is ShiftStatus => 
  Object.values(ShiftStatus).includes(value as ShiftStatus);

export const isValidUserRole = (value: any): value is UserRole => 
  Object.values(UserRole).includes(value as UserRole);
