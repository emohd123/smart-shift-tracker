import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuthState } from "@/hooks/useAuthState";
import { useAuthMethods, ProfileUpdate } from "@/hooks/useAuthHooks";
import { GenderType, VerificationStatus, UserRole } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unique_code?: string | null;
  metadata: Record<string, any>;
};

export type UserProfile = {
  id: string;
  unique_code: string;
  full_name: string;
  nationality: string;
  age: number;
  phone_number: string;
  gender: GenderType;
  height: number;
  weight: number;
  is_student: boolean;
  address: string;
  bank_details?: string;
  id_card_url?: string;
  profile_photo_url?: string;
  verification_status: VerificationStatus;
  role: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionData = {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
};

export { UserRole, GenderType, VerificationStatus } from "@/types/database";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (userId: string, profile: ProfileUpdate) => Promise<void>;
  getUserProfile: (userId: string) => Promise<UserProfile>;
  deactivateAccount: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  authError: string | null;
  subscription: SubscriptionData | null;
  checkSubscription: () => Promise<void>;
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
  subscription: null,
  checkSubscription: async () => {},
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
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  
  const login = async (email: string, password: string, remember: boolean = false): Promise<void> => {
    try {
      await loginMethod(email, password, remember);
      setAuthErrorState(null);
    } catch (error) {
      if (error instanceof Error) {
        setAuthErrorState(error.message);
      } else {
        setAuthErrorState("Failed to sign in");
      }
      throw error;
    }
  };
  
  const getUserProfile = async (userId: string): Promise<UserProfile> => {
    const profile = await getUserProfileMethod(userId);
    return {
      ...profile,
      gender: profile.gender as GenderType,
      verification_status: profile.verification_status as VerificationStatus
    } as UserProfile;
  };

  const updateProfile = async (userId: string, profile: ProfileUpdate): Promise<void> => {
    await updateProfileMethod(userId, profile);
  };

  const deactivateAccount = async (): Promise<void> => {
    await deactivateAccountMethod();
  };

  const deleteAccount = async (): Promise<void> => {
    await deleteAccountMethod();
  };

  const checkSubscription = async (): Promise<void> => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ subscribed: false, subscription_tier: 'free', subscription_end: null });
    }
  };
  
  useEffect(() => {
    setAuthErrorState(authError);
  }, [authError]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      setAuthErrorState(null);
      setSubscription(null);
    } else {
      checkSubscription();
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
        subscription,
        checkSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
