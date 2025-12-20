import { UserRole } from "@/types/database";

export function isAdminLike(role?: string | null): boolean {
  return role === UserRole.Admin || role === UserRole.SuperAdmin;
}

export function isCompanyLike(role?: string | null): boolean {
  return role === UserRole.Company || isAdminLike(role);
}


