
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { UploadCloud, X } from "lucide-react";

interface FileUploadFieldsProps {
  setIdCardFile: (file: File | null) => void;
  setProfilePhotoFile: (file: File | null) => void;
  currentIdCardUrl: string | null;
  currentProfilePhotoUrl: string | null;
}

export default function FileUploadFields({ 
  setIdCardFile, 
  setProfilePhotoFile,
  currentIdCardUrl,
  currentProfilePhotoUrl
}: FileUploadFieldsProps) {
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Set initial previews from current URLs
    if (currentIdCardUrl) {
      setIdCardPreview(currentIdCardUrl);
    }
    
    if (currentProfilePhotoUrl) {
      setProfilePhotoPreview(currentProfilePhotoUrl);
    }
  }, [currentIdCardUrl, currentProfilePhotoUrl]);

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setIdCardFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setIdCardPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProfilePhotoFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearIdCard = () => {
    setIdCardFile(null);
    setIdCardPreview(currentIdCardUrl);
  };

  const clearProfilePhoto = () => {
    setProfilePhotoFile(null);
    setProfilePhotoPreview(currentProfilePhotoUrl);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>ID Card</Label>
        
        {idCardPreview ? (
          <div className="relative border rounded-md p-4 flex flex-col items-center">
            <img 
              src={idCardPreview} 
              alt="ID Card Preview" 
              className="max-h-40 object-contain mb-2" 
            />
            <div className="flex space-x-2">
              <label htmlFor="id-card-upload" className="cursor-pointer">
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                >
                  Change
                </Button>
                <Input
                  id="id-card-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleIdCardChange}
                  className="hidden"
                />
              </label>
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
                onClick={clearIdCard}
              >
                Reset
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center">
              <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">
                Upload a photo of your ID card for verification
              </p>
              <label htmlFor="id-card-upload" className="cursor-pointer">
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                >
                  Select File
                </Button>
                <Input
                  id="id-card-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleIdCardChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Profile Photo</Label>
        
        {profilePhotoPreview ? (
          <div className="relative border rounded-md p-4 flex flex-col items-center">
            <img 
              src={profilePhotoPreview} 
              alt="Profile Photo Preview" 
              className="max-h-40 object-contain mb-2" 
            />
            <div className="flex space-x-2">
              <label htmlFor="profile-photo-upload" className="cursor-pointer">
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                >
                  Change
                </Button>
                <Input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
              </label>
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
                onClick={clearProfilePhoto}
              >
                Reset
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center">
              <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">
                Upload a profile photo (optional)
              </p>
              <label htmlFor="profile-photo-upload" className="cursor-pointer">
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                >
                  Select File
                </Button>
                <Input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
