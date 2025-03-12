import { User } from "@/context/AuthContext";

export const formatUser = (supabaseUser: any): User | null => {
  if (!supabaseUser) return null;

  // Default role is 'user', will be overridden if profile data has a different role
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
    role: 'user', // Default role, will be updated when profile is loaded
    metadata: supabaseUser.user_metadata || {},
  };
};
