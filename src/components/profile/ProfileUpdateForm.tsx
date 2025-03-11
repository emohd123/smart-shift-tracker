
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { UserProfile } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import ProfileFormFields from "./ProfileFormFields";
import FileUploadFields from "./FileUploadFields";
import ProfileHeader from "./ProfileHeader";

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
  const { user, getUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [currentProfilePhotoUrl, setCurrentProfilePhotoUrl] = useState<string | null>(null);
  const [currentIdCardUrl, setCurrentIdCardUrl] = useState<string | null>(null);

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
    const loadProfile = async () => {
      if (user) {
        try {
          // Direct Supabase query instead of using getUserProfile
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error("Error loading profile:", error);
            toast.error("Failed to load profile");
            return;
          }
          
          setProfileData(data);
          setCurrentProfilePhotoUrl(data.profile_photo_url || null);
          setCurrentIdCardUrl(data.id_card_url || null);
          
          form.reset({
            full_name: data.full_name || "",
            nationality: data.nationality || "",
            age: data.age || 18,
            phone_number: data.phone_number || "",
            gender: data.gender || "Male",
            height: data.height || 170,
            weight: data.weight || 70,
            is_student: data.is_student || false,
            address: data.address || "",
            bank_details: data.bank_details || "",
          });
        } catch (error) {
          console.error("Error loading profile:", error);
          toast.error("Failed to load profile");
        }
      }
    };
    loadProfile();
  }, [user, form]);

  // Create bucket if it doesn't exist
  const createBucketIfNotExists = async (bucketName: string) => {
    try {
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error(`Error checking buckets: ${bucketsError.message}`);
        return false;
      }
      
      const bucketExists = buckets?.some(b => b.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
        });
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}: ${error.message}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error in createBucketIfNotExists for ${bucketName}:`, error);
      return false;
    }
  };

  const handleFileUpload = async (file: File, bucket: string, userId: string) => {
    if (!file) return null;
    
    try {
      // Ensure bucket exists
      const bucketCreated = await createBucketIfNotExists(bucket);
      if (!bucketCreated) {
        throw new Error(`Failed to ensure bucket ${bucket} exists`);
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      console.log(`Uploading to ${bucket}/${fileName}`);
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      throw error;
    }
  };

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
        setProfileData(updatedProfile);
        setCurrentProfilePhotoUrl(updatedProfile.profile_photo_url || null);
        setCurrentIdCardUrl(updatedProfile.id_card_url || null);
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
