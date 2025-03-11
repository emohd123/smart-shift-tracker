
import FileUpload from "./ui/FileUpload";

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
  return (
    <div className="space-y-6">
      <FileUpload 
        label="ID Card"
        currentFileUrl={currentIdCardUrl}
        onFileChange={setIdCardFile}
        description="Upload a photo of your ID card for verification"
      />

      <FileUpload 
        label="Profile Photo"
        currentFileUrl={currentProfilePhotoUrl}
        onFileChange={setProfilePhotoFile}
        description="Upload a profile photo (optional)"
      />
    </div>
  );
}
