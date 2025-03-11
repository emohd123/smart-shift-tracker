
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAuthentication = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = async (emailOrUsername: string, password: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      let email = emailOrUsername;
      
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
            full_name: name // Make sure we pass the full_name here
          },
        },
      });

      if (error) {
        throw error;
      }

      // Insert into profiles table directly to ensure data consistency
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user?.id,
          full_name: name,
          nationality: '',  // Set default values for required fields
          age: 18,
          phone_number: '',
          gender: 'Other',
          height: 0,
          weight: 0,
          is_student: false,
          address: '',
          role: 'user'
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error("Failed to create user profile");
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
