
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "@/context/AuthContext";
import { UserRole } from "@/types/database";

export const formatUser = (user: SupabaseUser | null): User | null => {
  if (!user) return null;

  // Extract role from user metadata, defaulting to 'promoter' if not set
  const userRole = (user.user_metadata?.role || 'promoter') as UserRole;
  
  return {
    id: user.id,
    name: user.user_metadata?.full_name || 'User',
    email: user.email || '',
    role: userRole,
    metadata: user.user_metadata || {}
  };
};
