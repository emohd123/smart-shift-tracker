
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileUploadFieldsProps {
  setIdCardFile: (file: File | null) => void;
  setProfilePhotoFile: (file: File | null) => void;
}

export default function FileUploadFields({ 
  setIdCardFile, 
  setProfilePhotoFile 
}: FileUploadFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="id_card">ID Card</Label>
        <Input
          id="id_card"
          type="file"
          accept="image/*"
          onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
        />
        <p className="text-xs text-gray-500 mt-1">Upload a photo of your ID card for verification</p>
      </div>

      <div>
        <Label htmlFor="profile_photo">Profile Photo</Label>
        <Input
          id="profile_photo"
          type="file"
          accept="image/*"
          onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)}
        />
        <p className="text-xs text-gray-500 mt-1">Upload a profile photo (optional)</p>
      </div>
    </div>
  );
}
