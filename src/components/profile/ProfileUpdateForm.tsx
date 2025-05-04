
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/auth/useProfile";
import { ProfileUpdate } from "@/hooks/useAuthHooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProfileLoadingError from "./ProfileLoadingError";
import { Loader2 } from "lucide-react";
import FileUploadFields from "./FileUploadFields";
import ProfileFormFields from "./ProfileFormFields";

export default function ProfileUpdateForm() {
  const { user } = useAuth();
  const { getUserProfile, updateProfile, loading, error } = useProfile();
  const [profileData, setProfileData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id);
          setProfileData(profile);
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    };
    
    loadUserProfile();
  }, [user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !profileData) return;
    
    try {
      setSaving(true);
      
      // Format data for update
      const updateData: ProfileUpdate = {
        full_name: profileData.full_name || "",
        nationality: profileData.nationality || "",
        age: profileData.age || 18,
        phone_number: profileData.phone_number || null,
        gender: profileData.gender || "Male",
        height: profileData.height || 0,
        weight: profileData.weight || 0,
        is_student: Boolean(profileData.is_student),
        address: profileData.address || "",
        bank_details: profileData.bank_details || "",
      };
      
      // Handle file uploads here if needed
      
      await updateProfile(user.id, updateData);
      toast.success("Profile updated successfully");
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
  
  if (!profileData) {
    return (
      <div className="space-y-4">
        <p>No profile data available. Please complete your profile information.</p>
        <ProfileFormFields
          formData={{}}
          setFormData={setProfileData}
          readOnly={false}
        />
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ProfileFormFields
            formData={profileData}
            setFormData={setProfileData}
            readOnly={false}
          />
        </div>
        
        <div>
          <FileUploadFields
            setIdCardFile={setIdCardFile}
            setProfilePhotoFile={setProfilePhotoFile}
            currentIdCardUrl={profileData.id_card_url}
            currentProfilePhotoUrl={profileData.profile_photo_url}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
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
