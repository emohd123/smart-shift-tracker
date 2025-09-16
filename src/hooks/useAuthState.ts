
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "@/context/AuthContext";
import { formatUser } from "./auth/userFormat";
import { UserRole } from "@/types/database";

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
          
          if (formattedUser) {
            if (formattedUser.email.toLowerCase() === 'emohd123@gmail.com') {
              formattedUser.role = UserRole.Admin;
            }
            setUser(formattedUser);
            console.log("Auth state initialized with user:", formattedUser);
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
          
          if (formattedUser) {
            if (formattedUser.email.toLowerCase() === 'emohd123@gmail.com') {
              formattedUser.role = UserRole.Admin;
            }
            setUser(formattedUser);
            console.log("User set after auth state change:", formattedUser);
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
