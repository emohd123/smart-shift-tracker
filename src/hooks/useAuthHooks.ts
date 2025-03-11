
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, UserRole } from "@/context/AuthContext";
import { User as SupabaseUser } from "@supabase/supabase-js";

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

interface ProfileUpdate {
  name?: string;
}

export const useAuthMethods = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = async (emailOrUsername: string, password: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      // Convert username to email if needed
      let email = emailOrUsername;
      
      // If no @ symbol is present, assume it's a username and add the domain
      if (!email.includes('@')) {
        email = `${email}@gmail.com`;
      }
      
      console.log("Attempting login with:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      console.log("Login successful:", data.user);
      return data.user;
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "Invalid login credentials");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        throw error;
      }

      console.log("Signup successful:", data.user);
      return data.user;
    } catch (error: any) {
      console.error("Signup error:", error);
      setAuthError(error.message || "Could not create account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      // Ensure verification_status is the expected type
      if (data && data.verification_status) {
        data.verification_status = data.verification_status as "pending" | "approved" | "rejected";
      }
      
      return data;
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  return {
    login,
    signup,
    getUserProfile,
    resetPassword: async (email: string) => {
      setLoading(true);
      setAuthError(null);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        
        if (error) {
          throw error;
        }
      } catch (error: any) {
        console.error("Reset password error:", error);
        setAuthError(error.message || "Failed to send password reset email");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    updatePassword: async (password: string) => {
      setLoading(true);
      setAuthError(null);
      try {
        const { error } = await supabase.auth.updateUser({
          password,
        });
        
        if (error) {
          throw error;
        }
      } catch (error: any) {
        console.error("Update password error:", error);
        setAuthError(error.message || "Failed to update password");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    updateProfile: async (profile: ProfileUpdate) => {
      setLoading(true);
      setAuthError(null);
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            name: profile.name,
          },
        });
        
        if (error) {
          throw error;
        }
      } catch (error: any) {
        console.error("Update profile error:", error);
        setAuthError(error.message || "Failed to update profile");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    logout: async () => {
      try {
        await supabase.auth.signOut();
        setAuthError(null);
      } catch (error: any) {
        console.error("Error signing out:", error);
        setAuthError(error.message || "Error signing out");
      }
    },
    loading,
    authError,
  };
};
