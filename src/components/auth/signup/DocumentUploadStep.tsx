
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { FileData } from "./types";

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
  const { idCardPreview, profilePhotoPreview } = fileData;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Document Upload</h3>
      
      <div className="space-y-4">
        <Label htmlFor="idCard">ID Card (Required)</Label>
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
        <Label htmlFor="profilePhoto">Profile Photo (Required)</Label>
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
                <span>Click to upload a full-length profile photo</span>
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
    </div>
  );
}
