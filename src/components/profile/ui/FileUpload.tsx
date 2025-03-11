
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { UploadCloud } from "lucide-react";

interface FileUploadProps {
  label: string;
  currentFileUrl: string | null;
  onFileChange: (file: File | null) => void;
  description?: string;
}

export default function FileUpload({
  label,
  currentFileUrl,
  onFileChange,
  description
}: FileUploadProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const inputId = `${label.toLowerCase().replace(/\s/g, '-')}-upload`;

  useEffect(() => {
    // Set initial preview from current URL
    if (currentFileUrl) {
      setFilePreview(currentFileUrl);
    }
  }, [currentFileUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    onFileChange(null);
    setFilePreview(currentFileUrl);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {filePreview ? (
        <div className="relative border rounded-md p-4 flex flex-col items-center">
          <img 
            src={filePreview} 
            alt={`${label} Preview`}
            className="max-h-40 object-contain mb-2" 
          />
          <div className="flex space-x-2">
            <label htmlFor={inputId} className="cursor-pointer">
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
              >
                Change
              </Button>
              <Input
                id={inputId}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <Button 
              variant="outline" 
              size="sm" 
              type="button"
              onClick={clearFile}
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
              {description || `Upload ${label}`}
            </p>
            <label htmlFor={inputId} className="cursor-pointer">
              <Button 
                variant="outline" 
                size="sm" 
                type="button"
              >
                Select File
              </Button>
              <Input
                id={inputId}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
