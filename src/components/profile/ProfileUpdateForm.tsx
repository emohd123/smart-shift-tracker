
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { countries } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";

export default function ProfileUpdateForm() {
  const { user, getUserProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || "",
    nationality: "",
    age: "",
    phoneNumber: "",
    gender: "",
    height: "",
    weight: "",
    isStudent: false,
    address: "",
    bankDetails: "",
  });

  // File states
  const [idCard, setIdCard] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id);
          setFormData({
            name: profile.full_name,
            nationality: profile.nationality,
            age: profile.age.toString(),
            phoneNumber: profile.phone_number,
            gender: profile.gender,
            height: profile.height.toString(),
            weight: profile.weight.toString(),
            isStudent: profile.is_student,
            address: profile.address,
            bankDetails: profile.bank_details || "",
          });

          // Set file previews if they exist
          if (profile.id_card_url) {
            setIdCardPreview(profile.id_card_url);
          }
          if (profile.profile_photo_url) {
            setProfilePhotoPreview(profile.profile_photo_url);
          }
        } catch (error) {
          console.error("Error loading profile:", error);
          setError("Failed to load profile data");
        }
      }
    };

    loadProfile();
  }, [user, getUserProfile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'idCard' | 'profilePhoto') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, or PDF file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (fileType === 'idCard') {
        setIdCard(file);
        if (file.type !== 'application/pdf') {
          const reader = new FileReader();
          reader.onload = (e) => {
            setIdCardPreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          setIdCardPreview('/placeholder.svg');
        }
      } else {
        setProfilePhoto(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfilePhotoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadFiles = async (userId: string) => {
    try {
      let idCardUrl = null;
      let profilePhotoUrl = null;
      
      if (idCard) {
        const fileExt = idCard.name.split('.').pop();
        const fileName = `${userId}/id_card.${fileExt}`;
        
        const { error: idCardError } = await supabase.storage
          .from('id_cards')
          .upload(fileName, idCard, { upsert: true });
          
        if (idCardError) throw idCardError;
        idCardUrl = fileName;
      }
      
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${userId}/profile_photo.${fileExt}`;
        
        const { error: profilePhotoError } = await supabase.storage
          .from('profile_photos')
          .upload(fileName, profilePhoto, { upsert: true });
          
        if (profilePhotoError) throw profilePhotoError;
        profilePhotoUrl = fileName;
      }
      
      return { idCardUrl, profilePhotoUrl };
    } catch (error: any) {
      console.error("Error uploading files:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!user?.id) throw new Error("User not found");

      // Upload files if they've been changed
      const { idCardUrl, profilePhotoUrl } = await uploadFiles(user.id);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          nationality: formData.nationality,
          age: parseInt(formData.age),
          phone_number: formData.phoneNumber,
          gender: formData.gender as "Male" | "Female" | "Other",
          height: parseInt(formData.height),
          weight: parseInt(formData.weight),
          is_student: formData.isStudent,
          address: formData.address,
          bank_details: formData.bankDetails || null,
          ...(idCardUrl && { id_card_url: idCardUrl }),
          ...(profilePhotoUrl && { profile_photo_url: profilePhotoUrl }),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
    } catch (error: any) {
      console.error("Profile update error:", error);
      setError(error.message || "Failed to update profile");
      toast({
        title: "Update failed",
        description: error.message || "Could not update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Select
              value={formData.nationality}
              onValueChange={(value) => setFormData({...formData, nationality: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min="18"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({...formData, gender: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                id="isStudent"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.isStudent}
                onChange={(e) => setFormData({ ...formData, isStudent: e.target.checked })}
              />
              <Label htmlFor="isStudent">Are you a student?</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankDetails">Bank Account Details (Optional)</Label>
            <textarea
              id="bankDetails"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={formData.bankDetails}
              onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <Label>ID Card</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {idCardPreview ? (
                <div className="space-y-4">
                  <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg">
                    <img
                      src={idCardPreview}
                      alt="ID Card Preview"
                      className="h-40 mx-auto object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIdCard(null);
                      setIdCardPreview(null);
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Upload className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="flex flex-col items-center text-sm text-gray-500">
                    <span>Click to upload your ID card</span>
                    <span className="text-xs">(JPEG, PNG, or PDF, max 5MB)</span>
                  </div>
                  <Input
                    id="idCard"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange(e, 'idCard')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('idCard')?.click()}
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Profile Photo</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {profilePhotoPreview ? (
                <div className="space-y-4">
                  <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg">
                    <img
                      src={profilePhotoPreview}
                      alt="Profile Photo Preview"
                      className="h-60 mx-auto object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProfilePhoto(null);
                      setProfilePhotoPreview(null);
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Upload className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="flex flex-col items-center text-sm text-gray-500">
                    <span>Click to upload a profile photo</span>
                    <span className="text-xs">(JPEG or PNG, clear background, max 5MB)</span>
                  </div>
                  <Input
                    id="profilePhoto"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'profilePhoto')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('profilePhoto')?.click()}
                  >
                    Select File
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
