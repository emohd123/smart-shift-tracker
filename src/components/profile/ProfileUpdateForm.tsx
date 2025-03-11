
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { UserProfile } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import ProfileFormFields from "./ProfileFormFields";
import FileUploadFields from "./FileUploadFields";

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
          const profile = await getUserProfile(user.id);
          setProfileData(profile);
          form.reset({
            full_name: profile.full_name,
            nationality: profile.nationality,
            age: profile.age,
            phone_number: profile.phone_number,
            gender: profile.gender,
            height: profile.height,
            weight: profile.weight,
            is_student: profile.is_student,
            address: profile.address,
            bank_details: profile.bank_details || "",
          });
        } catch (error) {
          console.error("Error loading profile:", error);
          toast.error("Failed to load profile");
        }
      }
    };
    loadProfile();
  }, [user, getUserProfile, form]);

  const handleFileUpload = async (file: File, bucket: string, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    // Check if buckets exist, create them if they don't
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucket);
      
      if (!bucketExists) {
        await supabase.storage.createBucket(bucket, {
          public: true,
        });
      }
    } catch (error) {
      console.error(`Error checking/creating bucket ${bucket}:`, error);
    }
    
    const { error: uploadError, data } = await supabase.storage
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
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setLoading(true);

    try {
      let updates: Partial<UserProfile> = {
        ...values,
        id: user.id,
      };

      if (idCardFile) {
        try {
          const idCardUrl = await handleFileUpload(idCardFile, 'id_cards', user.id);
          updates.id_card_url = idCardUrl;
        } catch (error) {
          console.error("Error uploading ID card:", error);
          toast.error("Failed to upload ID card");
          // Continue with the rest of the profile update
        }
      }

      if (profilePhotoFile) {
        try {
          const photoUrl = await handleFileUpload(profilePhotoFile, 'profile_photos', user.id);
          updates.profile_photo_url = photoUrl;
        } catch (error) {
          console.error("Error uploading profile photo:", error);
          toast.error("Failed to upload profile photo");
          // Continue with the rest of the profile update
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      
      // Refresh the profile data
      const updatedProfile = await getUserProfile(user.id);
      setProfileData(updatedProfile);
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <ProfileFormFields form={form} />
          
          <FileUploadFields 
            setIdCardFile={setIdCardFile} 
            setProfilePhotoFile={setProfilePhotoFile} 
          />

          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
