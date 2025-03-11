
import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { useAuthMethods } from "@/hooks/useAuthHooks";

export type UserRole = "admin" | "promoter";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  authError: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, loading: stateLoading } = useAuthState();
  const { 
    login, 
    signup, 
    logout, 
    resetPassword, 
    updatePassword, 
    loading: methodsLoading, 
    authError 
  } = useAuthMethods();
  
  const [authErrorState, setAuthErrorState] = useState<string | null>(null);
  
  // Sync authError from hook with the context state
  useEffect(() => {
    setAuthErrorState(authError);
  }, [authError]);
  
  // Clear auth errors on sign out
  useEffect(() => {
    if (!isAuthenticated) {
      setAuthErrorState(null);
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading: stateLoading || methodsLoading,
        login,
        signup,
        logout,
        resetPassword,
        updatePassword,
        authError: authErrorState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
