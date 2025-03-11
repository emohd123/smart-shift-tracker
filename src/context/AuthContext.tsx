
import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { useAuthMethods } from "@/hooks/useAuthHooks";

export type UserRole = "admin" | "promoter";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  metadata: Record<string, any>;
}

export interface UserProfile {
  id: string;
  full_name: string;
  nationality: string;
  age: number;
  phone_number: string;
  gender: "Male" | "Female" | "Other";
  height: number;
  weight: number;
  is_student: boolean;
  address: string;
  bank_details?: string;
  id_card_url?: string;
  profile_photo_url?: string;
  verification_status: "pending" | "approved" | "rejected";
  role: string;
  created_at: string;
  updated_at: string;
}

interface ProfileUpdate {
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (userId: string, profile: ProfileUpdate) => Promise<void>;
  getUserProfile: (userId: string) => Promise<UserProfile>;
  deactivateAccount: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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
  updateProfile: async () => {},
  getUserProfile: async () => ({} as UserProfile),
  deactivateAccount: async () => {},
  deleteAccount: async () => {},
  authError: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, loading: stateLoading } = useAuthState();
  const { 
    login: loginMethod, 
    signup, 
    logout, 
    resetPassword, 
    updatePassword, 
    updateProfile: updateProfileMethod,
    getUserProfile: getUserProfileMethod,
    deactivateAccount: deactivateAccountMethod,
    deleteAccount: deleteAccountMethod,
    loading: methodsLoading, 
    authError 
  } = useAuthMethods();
  
  const [authErrorState, setAuthErrorState] = useState<string | null>(null);
  
  // Wrap login method to match the expected void return type
  const login = async (email: string, password: string): Promise<void> => {
    await loginMethod(email, password);
  };
  
  // Wrap getUserProfile to match the expected UserProfile return type
  const getUserProfile = async (userId: string): Promise<UserProfile> => {
    const profile = await getUserProfileMethod(userId);
    return {
      ...profile,
      verification_status: profile.verification_status as "pending" | "approved" | "rejected"
    } as UserProfile;
  };

  // Wrap updateProfile to match the expected void return type
  const updateProfile = async (userId: string, profile: ProfileUpdate): Promise<void> => {
    await updateProfileMethod(userId, profile);
  };

  // Wrap account removal methods
  const deactivateAccount = async (): Promise<void> => {
    await deactivateAccountMethod();
  };

  const deleteAccount = async (): Promise<void> => {
    await deleteAccountMethod();
  };
  
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
        updateProfile,
        getUserProfile,
        deactivateAccount,
        deleteAccount,
        authError: authErrorState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
