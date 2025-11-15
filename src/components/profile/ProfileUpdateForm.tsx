
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/auth/useProfile";
import { ProfileUpdate } from "@/hooks/useAuthHooks";
import { useSecurityMonitoring } from "@/hooks/security/useSecurityMonitoring";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ProfileLoadingError from "./ProfileLoadingError";
import FileUploadFields from "./FileUploadFields";
import ProfileFormFields from "./ProfileFormFields";
import { GenderType } from "@/types/database";
import { useFileUpload } from "./hooks/useFileUpload";

export default function ProfileUpdateForm() {
  const { user } = useAuth();
  const { getUserProfile, updateProfile, loading, error } = useProfile();
  const { logProfileUpdate } = useSecurityMonitoring();
  const [saving, setSaving] = useState(false);
  const { 
    idCardFile, 
    setIdCardFile, 
    profilePhotoFile, 
    setProfilePhotoFile, 
    uploadFiles, 
    isUploading 
  } = useFileUpload();
  
  const form = useForm({
    defaultValues: {
      unique_code: "",
      full_name: "",
      nationality: "",
      age: 18,
      phone_number: null as string | null,
      gender: GenderType.Male,
      height: 0,
      weight: 0,
      is_student: false,
      address: "",
      bank_details: "",
      id_card_url: null as string | null,
      profile_photo_url: null as string | null,
    }
  });
  
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id);
          if (profile) {
            // Reset form with profile data
            form.reset(profile);
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    };
    
    loadUserProfile();
  }, [user, form]);
  
  const handleSubmit = async (data: any) => {
    if (!user?.id) return;
    
    try {
      setSaving(true);
      
      // Step 1: Upload files first (if selected)
      let idCardUrl = data.id_card_url;
      let profilePhotoUrl = data.profile_photo_url;
      
      if (idCardFile || profilePhotoFile) {
        toast.info("Uploading files...");
        const uploadResults = await uploadFiles(user.id);
        
        // Update URLs with newly uploaded files
        if (uploadResults.idCardUrl) {
          idCardUrl = uploadResults.idCardUrl;
        }
        if (uploadResults.profilePhotoUrl) {
          profilePhotoUrl = uploadResults.profilePhotoUrl;
        }
      }
      
      // Step 2: Format data with file URLs
      const updateData: ProfileUpdate = {
        full_name: data.full_name || "",
        nationality: data.nationality || "",
        age: data.age || 18,
        phone_number: data.phone_number || null,
        gender: data.gender || GenderType.Male,
        height: data.height || 0,
        weight: data.weight || 0,
        is_student: Boolean(data.is_student),
        address: data.address || "",
        bank_details: data.bank_details || "",
        id_card_url: idCardUrl || null,
        profile_photo_url: profilePhotoUrl || null,
      };
      
      // Step 3: Update profile
      await updateProfile(user.id, updateData);
      
      // Clear file selections after successful upload
      setIdCardFile(null);
      setProfilePhotoFile(null);
      
      // Log and notify
      const updatedFields = Object.keys(updateData).filter(
        key => updateData[key as keyof ProfileUpdate] !== undefined
      );
      logProfileUpdate(user.id, updatedFields);
      
      toast.success("Profile and files updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update profile: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile data...</span>
      </div>
    );
  }
  
  if (error) {
    return <ProfileLoadingError message={error} />;
  }
  
  const hasProfile = form.getValues("full_name") !== "";
  
  if (!hasProfile) {
    return (
      <div className="space-y-4">
        <p>No profile data available. Please complete your profile information.</p>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <ProfileFormFields
            form={form}
            readOnly={false}
          />
      <div className="flex justify-end">
        <Button type="submit" disabled={saving || isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading Files...
            </>
          ) : saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </div>
        </form>
      </div>
    );
  }
  
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ProfileFormFields
            form={form}
            readOnly={false}
          />
        </div>
        
        <div>
          <FileUploadFields
            setIdCardFile={setIdCardFile}
            setProfilePhotoFile={setProfilePhotoFile}
            currentIdCardUrl={form.getValues("id_card_url")}
            currentProfilePhotoUrl={form.getValues("profile_photo_url")}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={saving || isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading Files...
            </>
          ) : saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
