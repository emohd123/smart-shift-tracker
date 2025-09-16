
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
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Invalid login credentials";
      setAuthError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, role: 'part_timer' | 'company_admin' = 'part_timer', tenantName?: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      console.log("Signing up with:", { name, email, role, tenantName });

      // Validate email domain before attempting signup
      const emailDomain = email.split('@')[1]?.toLowerCase();
      const blockedDomains = ['example.com', 'test.com', 'invalid.com'];

      if (blockedDomains.includes(emailDomain)) {
        throw new Error("Please use a valid email address from a recognized email provider (Gmail, Yahoo, Outlook, etc.)");
      }

      // For company admins, tenant name is required
      if (role === 'company_admin' && !tenantName) {
        throw new Error("Company name is required for company admin signup");
      }

      // Step 1: Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role
          },
        },
      });

      if (authError) {
        console.error("Supabase signup error:", authError);

        // Handle specific Supabase email validation errors
        if (authError.message.includes("Email address") && authError.message.includes("is invalid")) {
          throw new Error("Please use a valid email address from a recognized email provider (Gmail, Yahoo, Outlook, etc.)");
        }

        // Provide more user-friendly error messages
        if (authError.message.includes("already registered")) {
          throw new Error("This email is already registered. Please use a different email or try logging in.");
        } else if (authError.message.includes("network")) {
          throw new Error("Network error. Please check your connection and try again.");
        } else {
          throw authError;
        }
      }

      if (!authData.user) {
        console.error("No user returned from signup");
        throw new Error("Failed to create user account");
      }

      console.log("Auth user created:", authData.user.id);

      // Step 2: Create tenant and membership for company admins, or find default tenant for part-timers
      let tenantId: string;
      
      if (role === 'company_admin' && tenantName) {
        // Create a new tenant for company admin
        const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: tenantName,
            slug: slug,
            subscription_tier: 'starter',
            subscription_status: 'active',
            max_users: 10,
            settings: {}
          })
          .select()
          .single();

        if (tenantError) {
          console.error("Tenant creation error:", tenantError);
          // Try to clean up the auth user if tenant creation fails
          await supabase.auth.admin.deleteUser(authData.user.id);
          
          // Provide specific error messages based on the error
          if (tenantError.message.includes("schema cache")) {
            throw new Error("Database setup incomplete. Please contact support - the tenant tables are missing.");
          } else if (tenantError.message.includes("row-level security")) {
            throw new Error("Permission denied. Please contact support - database policies need to be configured.");
          } else {
            throw new Error(`Failed to create company: ${tenantError.message}`);
          }
        }

        tenantId = tenantData.id;
        console.log("Tenant created:", tenantId);
      } else {
        // For part-timers, create a default personal tenant or use existing system
        const personalTenantName = `${name}'s Workspace`;
        const slug = `personal-${authData.user.id.substring(0, 8)}`;
        
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: personalTenantName,
            slug: slug,
            subscription_tier: 'starter',
            subscription_status: 'active',
            max_users: 1,
            settings: {}
          })
          .select()
          .single();

        if (tenantError) {
          console.error("Personal tenant creation error:", tenantError);
          // Try to clean up the auth user if tenant creation fails
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Failed to create personal workspace: ${tenantError.message}`);
        }

        tenantId = tenantData.id;
        console.log("Personal tenant created:", tenantId);
      }

      // Step 3: Create tenant membership
      const { error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert({
          tenant_id: tenantId,
          user_id: authData.user.id,
          role: role,
          status: 'active',
          joined_at: new Date().toISOString()
        });

      if (membershipError) {
        console.error("Membership creation error:", membershipError);
        throw new Error(`Failed to create membership: ${membershipError.message}`);
      }

      console.log("Tenant membership created");

      // Step 4: Create user profile with tenant association
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          tenant_id: tenantId,
          full_name: name,
          nationality: '',
          age: 0,
          phone_number: '',
          gender: 'Male',
          height: 0,
          weight: 0,
          is_student: false,
          address: '',
          verification_status: 'pending',
          role: role
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't fail the entire signup for profile creation issues
        console.warn("Profile creation failed but user and tenant were created successfully");
      } else {
        console.log("User profile created");
      }

      console.log("Signup successful:", authData.user);
      return authData.user;
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not create account";
      setAuthError(errorMessage);
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
    } catch (error) {
      console.error("Error signing out:", error);
      const errorMessage = error instanceof Error ? error.message : "Error signing out";
      setAuthError(errorMessage);
      toast.error(errorMessage);
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
