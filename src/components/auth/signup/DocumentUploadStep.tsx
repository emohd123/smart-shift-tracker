
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, FileIcon, XCircle } from "lucide-react";
import { FileData } from "./types";
import { useState, useEffect } from "react";

interface DocumentUploadStepProps {
  fileData: FileData;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, fileType: 'idCard' | 'profilePhoto') => void;
  setIdCard: (file: File | null) => void;
  setIdCardPreview: (preview: string | null) => void;
  setProfilePhoto: (file: File | null) => void;
  setProfilePhotoPreview: (preview: string | null) => void;
}

export function DocumentUploadStep({
  fileData,
  handleFileChange,
  setIdCard,
  setIdCardPreview,
  setProfilePhoto,
  setProfilePhotoPreview,
}: DocumentUploadStepProps) {
  const { idCardPreview, profilePhotoPreview, idCard } = fileData;
  const [idCardError, setIdCardError] = useState<string | null>(null);
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(null);
  
  const isPDF = idCard?.type === 'application/pdf';
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (idCardPreview && typeof idCardPreview === 'string' && idCardPreview.startsWith('blob:')) {
        URL.revokeObjectURL(idCardPreview);
      }
      if (profilePhotoPreview && typeof profilePhotoPreview === 'string' && profilePhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePhotoPreview);
      }
    };
  }, [idCardPreview, profilePhotoPreview]);

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdCardError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation logic moved to the hook
    handleFileChange(e, 'idCard');
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfilePhotoError(null);
    const file = e.target.files?.[0];
    
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setProfilePhotoError('Please select a JPEG or PNG image file');
        return;
      }
      
      if (file.size > maxFileSize) {
        setProfilePhotoError('File size must be less than 5MB');
        return;
      }
      
      // Create preview URL safely
      try {
        const previewUrl = URL.createObjectURL(file);
        setProfilePhoto(file);
        setProfilePhotoPreview(previewUrl);
      } catch (error) {
        setProfilePhotoError('Failed to create image preview');
        console.error('Error creating preview:', error);
      }
    }
    
    // Also call the original handler
    handleFileChange(e, 'profilePhoto');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Document Upload</h3>
        <p className="text-sm text-muted-foreground">
          Upload your documents now or skip and add them later from your profile
        </p>
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="idCard">ID Card (Optional)</Label>
        <div className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center ${idCardError ? 'border-destructive bg-destructive/5' : 'border-gray-300'}`}>
          {idCardError && (
            <div className="flex items-center justify-center text-destructive mb-2 text-sm">
              <XCircle className="h-4 w-4 mr-1" />
              {idCardError}
            </div>
          )}
          
          {idCardPreview ? (
            <div className="space-y-4">
              <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg">
                {isPDF ? (
                  <div className="flex flex-col items-center justify-center h-32 md:h-40 bg-gray-50">
                    <FileIcon className="h-12 w-12 md:h-16 md:w-16 text-primary mb-2" />
                    <p className="text-sm font-medium truncate max-w-[90%]">{idCard.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF document uploaded</p>
                  </div>
                ) : (
                  <img
                    src={idCardPreview}
                    alt="ID Card Preview"
                    className="h-32 md:h-40 mx-auto object-contain"
                    onError={() => setIdCardError("Failed to load preview")}
                  />
                )}
              </div>
              <div className="flex justify-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIdCard(null);
                    setIdCardPreview(null);
                    setIdCardError(null);
                  }}
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('idCard')?.click()}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-gray-100">
                <Upload className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
              </div>
              <div className="flex flex-col items-center text-sm text-gray-500">
                <span>Click to upload your ID card</span>
                <span className="text-xs">(JPEG, PNG, or PDF, max 5MB)</span>
              </div>
              <Input
                id="idCard"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,application/pdf,image/jpeg,image/png"
                onChange={handleIdCardChange}
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
        <Label htmlFor="profilePhoto">Profile Photo *</Label>
        <div className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center ${profilePhotoError ? 'border-destructive bg-destructive/5' : 'border-gray-300'}`}>
          {profilePhotoError && (
            <div className="flex items-center justify-center text-destructive mb-2 text-sm">
              <XCircle className="h-4 w-4 mr-1" />
              {profilePhotoError}
            </div>
          )}
          
          {profilePhotoPreview ? (
            <div className="space-y-4">
              <div className="relative mx-auto max-w-xs overflow-hidden rounded-lg">
                <img
                  src={profilePhotoPreview}
                  alt="Profile Photo Preview"
                  className="h-48 md:h-60 mx-auto object-contain rounded-lg border"
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                    setProfilePhotoError("Failed to load preview. Please try a different image.");
                  }}
                  onLoad={() => {
                    // Clear any previous errors when image loads successfully
                    setProfilePhotoError(null);
                  }}
                />
              </div>
              <div className="flex justify-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Clean up the object URL to prevent memory leaks
                    if (profilePhotoPreview) {
                      URL.revokeObjectURL(profilePhotoPreview);
                    }
                    setProfilePhoto(null);
                    setProfilePhotoPreview(null);
                    setProfilePhotoError(null);
                  }}
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('profilePhoto')?.click()}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-gray-100">
                <Upload className="h-5 w-5 md:h-6 md:w-6 text-gray-500" />
              </div>
              <div className="flex flex-col items-center text-sm text-gray-500">
                <span>Click to upload a full-length profile photo</span>
                <span className="text-xs">(JPEG or PNG, clear background, max 5MB)</span>
              </div>
              <Input
                id="profilePhoto"
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handleProfilePhotoChange}
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
    </div>
  );
}
