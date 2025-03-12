
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "@/context/AuthContext";
import { formatUser } from "./auth/userFormat";

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Found existing session:", session.user.email);
          setSupabaseUser(session.user);
          
          // Get the base user first
          const formattedUser = formatUser(session.user);
          
          // Fetch the profile to get the role
          if (formattedUser) {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', formattedUser.id)
                .single();
              
              if (error) {
                console.error("Error fetching user profile:", error);
              }
              
              if (profileData) {
                // Update user with role from profile
                formattedUser.role = profileData.role as any;
              }
              
              setUser(formattedUser);
              console.log("Auth state initialized with user:", formattedUser);
            } catch (error) {
              console.error("Error fetching user profile:", error);
              setUser(formattedUser);
            }
          }
        } else {
          console.log("No active session found");
          setUser(null);
          setSupabaseUser(null);
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
        setUser(null);
        setSupabaseUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Get the base user first
          const formattedUser = formatUser(session.user);
          
          // Fetch the profile to get the role
          if (formattedUser) {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', formattedUser.id)
                .single();
              
              if (error) {
                console.error("Error fetching user profile on auth change:", error);
              }
              
              if (profileData) {
                // Update user with role from profile
                formattedUser.role = profileData.role as any;
              }
              
              setUser(formattedUser);
              console.log("User set after auth state change:", formattedUser);
            } catch (error) {
              console.error("Error fetching user profile:", error);
              setUser(formattedUser);
            }
          }
        } else {
          console.log("User signed out or session expired");
          setUser(null);
          setSupabaseUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
  };
};
