
import { User } from "@/context/AuthContext";
import { UserRole } from "@/types/database";
import { User as SupabaseUser } from "@supabase/supabase-js";

export const formatUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;

  // Default role is 'part_timer', will be overridden if profile data has a different role
  const metadataRole = (supabaseUser.user_metadata?.role as string | undefined)?.toLowerCase();
  const derivedRole: UserRole = metadataRole === 'company_admin'
    ? UserRole.CompanyAdmin
    : metadataRole === 'company_manager'
      ? UserRole.CompanyManager
      : metadataRole === 'admin'
        ? UserRole.Admin
        : UserRole.PartTimer;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
    role: derivedRole, // Prefer role from metadata; profile may still override later
    metadata: supabaseUser.user_metadata || {},
  };
};
