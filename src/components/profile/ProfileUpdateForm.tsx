
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { UserProfile } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import ProfileFormFields from "./ProfileFormFields";
import FileUploadFields from "./FileUploadFields";
import ProfileHeader from "./ProfileHeader";
import { useProfileData } from "./hooks/useProfileData";
import { useFileUpload } from "./hooks/useFileUpload";
import { useProfile } from "@/hooks/auth/useProfile";
import { ProfileUpdate } from "@/hooks/useAuthHooks";
import { GenderType } from "@/types/database";

const formSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  nationality: z.string().min(2, { message: "Nationality is required." }),
  age: z.number().min(18, { message: "Must be at least 18 years old." }),
  phone_number: z.string().min(8, { message: "Valid phone number is required." }),
  gender: z.nativeEnum(GenderType), // Using our enumerated gender type
  height: z.number().min(100, { message: "Enter height in cm" }),
  weight: z.number().min(30, { message: "Enter weight in kg" }),
  is_student: z.boolean(),
  address: z.string().min(5, { message: "Address is required." }),
  bank_details: z.string().optional(),
});

export default function ProfileUpdateForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useProfile();
  
  const { 
    profileData, 
    setProfileData,
    currentProfilePhotoUrl, 
    setCurrentProfilePhotoUrl,
    currentIdCardUrl, 
    setCurrentIdCardUrl,
    loading: profileLoading,
    error: profileLoadError
  } = useProfileData(user);
  
  const {
    uploadFiles,
    idCardFile, 
    setIdCardFile,
    profilePhotoFile, 
    setProfilePhotoFile,
    isUploading
  } = useFileUpload();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      nationality: "",
      age: 18,
      phone_number: "",
      gender: GenderType.Male, // Default using our enum type
      height: 170,
      weight: 70,
      is_student: false,
      address: "",
      bank_details: "",
    },
  });

  useEffect(() => {
    if (profileData) {
      console.log("Setting form values from profile data:", profileData);
      form.reset({
        full_name: profileData.full_name || "",
        nationality: profileData.nationality || "",
        age: profileData.age || 18,
        phone_number: profileData.phone_number || "",
        gender: profileData.gender || GenderType.Male,
        height: profileData.height || 170,
        weight: profileData.weight || 70,
        is_student: profileData.is_student || false,
        address: profileData.address || "",
        bank_details: profileData.bank_details || "",
      });
    }
  }, [profileData, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    setLoading(true);

    try {
      console.log("Submitting form values:", values);
      
      let updates: ProfileUpdate = {
        ...values,
      };

      if (idCardFile || profilePhotoFile) {
        const { idCardUrl, profilePhotoUrl } = await uploadFiles(user.id);
        
        if (idCardUrl) {
          updates.id_card_url = idCardUrl;
        }
        
        if (profilePhotoUrl) {
          updates.profile_photo_url = profilePhotoUrl;
        }
      }

      console.log("Updating profile with:", updates);
      
      // Update the profile in the database
      await updateProfile(user.id, updates);
      
      // Refresh the profile data
      const updatedProfile = await fetch(`/api/profiles/${user.id}`).then(res => res.json())
        .catch(() => {
          console.log("Using direct profile fetch instead of API");
          return null;
        });
      
      if (updatedProfile) {
        setProfileData(updatedProfile);
        setCurrentProfilePhotoUrl(updatedProfile.profile_photo_url || null);
        setCurrentIdCardUrl(updatedProfile.id_card_url || null);
      } else {
        // If the API call fails, refresh the profile data using the hook
        const refreshedProfile = await form.getValues();
        setProfileData(prevProfile => ({
          ...prevProfile!,
          ...refreshedProfile,
        }) as UserProfile);
      }
      
      toast.success("Profile updated successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error updating profile:", errorMessage);
      toast.error("Failed to update profile: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {profileLoading ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-pulse text-primary">Loading profile data...</div>
        </div>
      ) : profileLoadError ? (
        <div className="text-center py-4">
          <div className="text-red-500 mb-2">Error loading profile: {profileLoadError}</div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <ProfileHeader 
            profilePhotoUrl={currentProfilePhotoUrl} 
            userName={profileData?.full_name || user?.name || "User"} 
          />
          
          <Card className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ProfileFormFields form={form} />
              
              <FileUploadFields 
                setIdCardFile={setIdCardFile} 
                setProfilePhotoFile={setProfilePhotoFile}
                currentIdCardUrl={currentIdCardUrl}
                currentProfilePhotoUrl={currentProfilePhotoUrl}
              />

              <Button type="submit" disabled={loading || isUploading}>
                {loading || isUploading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
