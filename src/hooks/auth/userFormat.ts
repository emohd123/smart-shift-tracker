
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User, UserRole } from "@/context/AuthContext";

// Utility function to format user data
export const formatUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;

  const role: UserRole = supabaseUser.email === "emohd123@gmail.com" ? "admin" : "promoter";

  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || "User",
    email: supabaseUser.email || "",
    role: role,
  };
};
