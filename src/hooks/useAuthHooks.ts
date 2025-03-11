
import { useState } from "react";
import { useAuthentication } from "./auth/useAuthentication";
import { useAccount } from "./auth/useAccount";
import { useProfile } from "./auth/useProfile";
import { UserProfile } from "@/context/AuthContext";

export { formatUser } from "./auth/userFormat";

// Update ProfileUpdate to match properties in UserProfile
export interface ProfileUpdate extends Partial<UserProfile> {
  // This now extends Partial<UserProfile> so it has all the same properties
}

export const useAuthMethods = () => {
  const { 
    login, 
    signup, 
    logout, 
    loading: authLoading, 
    authError: authenticationError 
  } = useAuthentication();
  
  const { 
    deactivateAccount, 
    deleteAccount, 
    resetPassword, 
    updatePassword,
    loading: accountLoading,
    authError: accountError
  } = useAccount();
  
  const { 
    getUserProfile, 
    updateProfile,
    loading: profileLoading,
    error: profileError
  } = useProfile();

  // Combine loading states and errors
  const loading = authLoading || accountLoading || profileLoading;
  const authError = authenticationError || accountError || profileError;

  return {
    login,
    signup,
    logout,
    getUserProfile,
    resetPassword,
    updatePassword,
    updateProfile: (userId: string, profile: ProfileUpdate) => updateProfile(userId, profile),
    deactivateAccount,
    deleteAccount,
    loading,
    authError,
  };
};
