
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User, UserRole } from "@/context/AuthContext";

// Utility function to format user data
export const formatUser = (supabaseUser: SupabaseUser | null): User | null => {
  if (!supabaseUser) return null;

  // Extract name from metadata or use a friendly version of email
  const fullName = supabaseUser.user_metadata?.full_name || 
                  supabaseUser.user_metadata?.name || 
                  (supabaseUser.email ? supabaseUser.email.split('@')[0] : "User");
  
  // Determine role - this can be customized based on your needs
  const role: UserRole = supabaseUser.email === "emohd123@gmail.com" ? "admin" : "promoter";

  // Get additional metadata if available
  const metadata = supabaseUser.user_metadata || {};

  return {
    id: supabaseUser.id,
    name: fullName,
    email: supabaseUser.email || "",
    role: role,
    metadata: metadata
  };
};
