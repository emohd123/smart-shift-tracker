
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

          setSupabaseUser(session.user);

          // Get the base user first
          const formattedUser = formatUser(session.user);

          if (formattedUser) {
            try {
              // Fetch role from user_roles table using security definer function
              const { data: roleData, error: roleError } = await supabase
                .rpc('get_user_role', { _user_id: formattedUser.id });

              if (roleError) {
                console.error("Error fetching user role:", roleError);
              } else if (roleData) {
                formattedUser.role = roleData as UserRole;
              }

              setUser(formattedUser);

            } catch (error) {
              console.error("Error fetching user role:", error);
              setUser(formattedUser);
            }
          }
        } else {

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
      (event, session) => {


        if (session?.user) {
          setSupabaseUser(session.user);

          // Get the base user first
          const formattedUser = formatUser(session.user);

          if (formattedUser) {
            // Set user immediately with basic info
            setUser(formattedUser);


            // Defer Supabase RPC call using setTimeout to prevent deadlock
            setTimeout(() => {
              supabase
                .rpc('get_user_role', { _user_id: formattedUser.id })
                .then(({ data: roleData, error: roleError }) => {
                  if (roleError) {
                    console.error("Error fetching user role:", roleError);
                  } else if (roleData) {
                    formattedUser.role = roleData as UserRole;
                    setUser({ ...formattedUser });
                  }
                });
            }, 0);
          }
        } else {

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
