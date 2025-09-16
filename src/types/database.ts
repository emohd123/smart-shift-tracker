
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

// Legacy role mappings for backward compatibility
export const LEGACY_ROLE_MAPPINGS = {
  Company: UserRole.CompanyAdmin,
  Promoter: UserRole.PartTimer
} as const;

// Type guards for runtime type checking
export const isValidGender = (value: unknown): value is GenderType => 
  Object.values(GenderType).includes(value as GenderType);

export const isValidVerificationStatus = (value: unknown): value is VerificationStatus => 
  Object.values(VerificationStatus).includes(value as VerificationStatus);

export const isValidShiftStatus = (value: unknown): value is ShiftStatus => 
  Object.values(ShiftStatus).includes(value as ShiftStatus);

export const isValidUserRole = (value: unknown): value is UserRole => 
  Object.values(UserRole).includes(value as UserRole);
