
import { User } from "@/context/AuthContext";
import { UserRole, isValidUserRole } from "@/types/database";

export const formatUser = (supabaseUser: any): User | null => {
  if (!supabaseUser) return null;

  // Prefer role from auth metadata (set at signup) so routing is correct before RPC fetch
  const metaRole = supabaseUser.user_metadata?.role;
  const initialRole = isValidUserRole(metaRole) ? metaRole : UserRole.Promoter;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
    role: initialRole,
    metadata: supabaseUser.user_metadata || {},
  };
};
