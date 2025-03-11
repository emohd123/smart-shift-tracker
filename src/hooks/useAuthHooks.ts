
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
      // Handle the case where user enters just "emohd123" instead of full email
      let email = emailOrUsername;
      
      // If no @ symbol is present, assume it's a username and add the domain
      if (!email.includes('@')) {
        // Check if this is the admin username
        if (email === "emohd123") {
          email = "emohd123@gmail.com";
        } else {
          // For other usernames, assume they're using hotmail
          // You can adjust this based on your user base
          email = `${email}@hotmail.com`;
        }
      }
      
      console.log("Attempting login with:", email);
      
      // Special case for admin validation
      if (email === "emohd123@gmail.com" && password !== "password123") {
        throw new Error("Invalid admin credentials");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Email not confirmed") {
          await supabase.auth.resend({
            type: 'signup',
            email: email
          });
          throw new Error("Your email is not confirmed. A new confirmation email has been sent. Please check your inbox and spam folder.");
        }
        throw error;
      }
      
      console.log("Login successful:", data.user);
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
    } catch (error: any) {
      console.error("Signup error:", error);
      setAuthError(error.message || "Could not create account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
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
  };

  const updatePassword = async (password: string) => {
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
  };

  const updateProfile = async (profile: ProfileUpdate) => {
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
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setAuthError(null);
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error.message || "Error signing out");
    }
  };

  return {
    login,
    signup,
    resetPassword,
    updatePassword,
    updateProfile,
    logout,
    loading,
    authError,
  };
};
