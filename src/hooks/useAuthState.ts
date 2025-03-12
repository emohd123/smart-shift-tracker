
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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSupabaseUser(session.user);
          
          // Get the base user first
          const formattedUser = formatUser(session.user);
          
          // Fetch the profile to get the role
          if (formattedUser) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', formattedUser.id)
                .single();
              
              if (profileData) {
                // Update user with role from profile
                formattedUser.role = profileData.role as any;
              }
              
              setUser(formattedUser);
            } catch (error) {
              console.error("Error fetching user profile:", error);
              setUser(formattedUser);
            }
          }
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        setSupabaseUser(session?.user || null);
        
        if (session?.user) {
          // Get the base user first
          const formattedUser = formatUser(session.user);
          
          // Fetch the profile to get the role
          if (formattedUser) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', formattedUser.id)
                .single();
              
              if (profileData) {
                // Update user with role from profile
                formattedUser.role = profileData.role as any;
              }
              
              setUser(formattedUser);
            } catch (error) {
              console.error("Error fetching user profile:", error);
              setUser(formattedUser);
            }
          }
        } else {
          setUser(null);
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
