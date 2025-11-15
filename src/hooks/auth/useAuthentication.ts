
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ErrorSeverity, useError } from "@/context/ErrorContext";

export const useAuthentication = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const login = async (emailOrUsername: string, password: string, remember: boolean = false) => {
    // Prevent login attempt with empty fields
    if (!emailOrUsername || !password) {
      throw new Error("Email and password are required");
    }
    
    setLoading(true);
    setAuthError(null);
    try {
      let email = emailOrUsername.trim();
      
      // Simple email validation to check if it contains @ symbol
      if (!email.includes('@')) {
        // Check if it ends with @gmail.com already to avoid double appending
        if (!email.endsWith('@gmail.com')) {
          email = `${email}@gmail.com`;
        }
      }
      
      console.log("Attempting login with:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error from Supabase:", error);
        
        // Provide more user-friendly error messages
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error("Please confirm your email before signing in.");
        } else if (error.message.includes("network")) {
          throw new Error("Network error. Please check your connection and try again.");
        } else {
          throw new Error(error.message || "Login failed. Please check your credentials.");
        }
      }
      
      if (!data.user) {
        console.error("No user returned from login");
        throw new Error("Login failed. Please try again.");
      }
      
      console.log("Login successful:", data.user);
      
      // Save auth state to localStorage if remember me is checked
      if (remember) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      return data.user;
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(error.message || "Invalid login credentials");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: string = 'promoter') => {
    setLoading(true);
    setAuthError(null);
    try {
      console.log("Signing up with:", { name, email, role });
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("Supabase signup error:", error);
        
        if (error.message.includes("User already registered")) {
          throw new Error("This email is already registered. Please login instead.");
        } else if (error.message.includes("Invalid email")) {
          throw new Error("Please enter a valid email address.");
        } else if (error.message.includes("Password")) {
          throw new Error("Password must be at least 6 characters long.");
        } else {
          throw error;
        }
      }

      if (!data.user) {
        console.error("No user returned from signup");
        throw new Error("Failed to create user account");
      }

      console.log("✓ Signup successful:", data.user.id);
      return data.user;
    } catch (error: any) {
      console.error("Signup error:", error);
      setAuthError(error.message || "Could not create account");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      console.log("Logout successful");
      toast.success("Logged out successfully");
      setAuthError(null);
      
      // Clear remember me state
      localStorage.removeItem('rememberMe');
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error.message || "Error signing out");
      toast.error(error.message || "Error signing out");
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    signup,
    logout,
    loading,
    authError,
  };
};
