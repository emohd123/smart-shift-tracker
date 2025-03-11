
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { UserProfile } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import ProfileFormFields from "./ProfileFormFields";
import FileUploadFields from "./FileUploadFields";
import ProfileHeader from "./ProfileHeader";
import { useProfileData } from "./hooks/useProfileData";
import { useFileUpload } from "./hooks/useFileUpload";

const formSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  nationality: z.string().min(2, { message: "Nationality is required." }),
  age: z.number().min(18, { message: "Must be at least 18 years old." }),
  phone_number: z.string().min(8, { message: "Valid phone number is required." }),
  gender: z.enum(["Male", "Female", "Other"]),
  height: z.number().min(100, { message: "Enter height in cm" }),
  weight: z.number().min(30, { message: "Enter weight in kg" }),
  is_student: z.boolean(),
  address: z.string().min(5, { message: "Address is required." }),
  bank_details: z.string().optional(),
});

export default function ProfileUpdateForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const { 
    profileData, 
    setProfileData,
    currentProfilePhotoUrl, 
    setCurrentProfilePhotoUrl,
    currentIdCardUrl, 
    setCurrentIdCardUrl
  } = useProfileData(user);
  
  const {
    handleFileUpload,
    idCardFile, 
    setIdCardFile,
    profilePhotoFile, 
    setProfilePhotoFile
  } = useFileUpload();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      nationality: "",
      age: 18,
      phone_number: "",
      gender: "Male",
      height: 170,
      weight: 70,
      is_student: false,
      address: "",
      bank_details: "",
    },
  });

  useEffect(() => {
    if (profileData) {
      form.reset({
        full_name: profileData.full_name || "",
        nationality: profileData.nationality || "",
        age: profileData.age || 18,
        phone_number: profileData.phone_number || "",
        gender: profileData.gender || "Male",
        height: profileData.height || 170,
        weight: profileData.weight || 70,
        is_student: profileData.is_student || false,
        address: profileData.address || "",
        bank_details: profileData.bank_details || "",
      });
    }
  }, [profileData, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setLoading(true);

    try {
      let updates: Partial<UserProfile> = {
        ...values,
        id: user.id,
      };

      // Handle ID card upload
      if (idCardFile) {
        try {
          const idCardUrl = await handleFileUpload(idCardFile, 'id_cards', user.id);
          if (idCardUrl) {
            updates.id_card_url = idCardUrl;
          }
        } catch (error) {
          console.error("Error uploading ID card:", error);
          toast.error("Failed to upload ID card");
          // Continue with the rest of the profile update
        }
      }

      // Handle profile photo upload
      if (profilePhotoFile) {
        try {
          const photoUrl = await handleFileUpload(profilePhotoFile, 'profile_photos', user.id);
          if (photoUrl) {
            updates.profile_photo_url = photoUrl;
          }
        } catch (error) {
          console.error("Error uploading profile photo:", error);
          toast.error("Failed to upload profile photo");
          // Continue with the rest of the profile update
        }
      }

      console.log("Updating profile with:", updates);
      
      // Direct Supabase query instead of using an intermediary function
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error("Profile update error:", error);
        toast.error(`Error updating profile: ${error.message}`);
        throw error;
      }

      toast.success("Profile updated successfully");
      
      // Refresh the profile data
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) {
        console.error("Error fetching updated profile:", fetchError);
      } else {
        const typedProfile = {
          ...updatedProfile,
          verification_status: updatedProfile.verification_status as "pending" | "approved" | "rejected"
        } as UserProfile;
        
        setProfileData(typedProfile);
        setCurrentProfilePhotoUrl(typedProfile.profile_photo_url || null);
        setCurrentIdCardUrl(typedProfile.id_card_url || null);
      }
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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

          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
