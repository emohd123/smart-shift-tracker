
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { UploadCloud, FileText, ExternalLink } from "lucide-react";

interface FileUploadProps {
  label: string;
  currentFileUrl: string | null;
  onFileChange: (file: File | null) => void;
  description?: string;
  acceptTypes?: string;
}

// Check if a URL or file is a PDF
const isPdfFile = (url: string | null, file?: File | null): boolean => {
  if (file?.type === 'application/pdf') return true;
  if (url?.toLowerCase().endsWith('.pdf')) return true;
  if (url?.includes('application/pdf')) return true;
  return false;
};

export default function FileUpload({
  label,
  currentFileUrl,
  onFileChange,
  description,
  acceptTypes = "image/*"
}: FileUploadProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `${label.toLowerCase().replace(/\s/g, '-')}-upload`;

  useEffect(() => {
    // Set initial preview from current URL
    if (currentFileUrl) {
      setFilePreview(currentFileUrl);
    }
  }, [currentFileUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      console.log(`File selected for ${label}:`, file.name);
      setSelectedFile(file);
      onFileChange(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isPdf = isPdfFile(filePreview, selectedFile);

  const clearFile = () => {
    onFileChange(null);
    setSelectedFile(null);
    setFilePreview(currentFileUrl);
    // Reset the input field value
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {filePreview ? (
        <div className="relative border rounded-md p-4 flex flex-col items-center">
          {isPdf ? (
            // PDF Preview
            <div className="w-full mb-2">
              <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 text-red-500" />
                <span className="text-sm font-medium">PDF Document</span>
                <a
                  href={filePreview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open PDF
                </a>
              </div>
            </div>
          ) : (
            // Image Preview
            <img
              src={filePreview}
              alt={`${label} Preview`}
              className="max-h-40 object-contain mb-2"
            />
          )}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={triggerFileInput}
            >
              Change
              <Input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={acceptTypes}
                onChange={handleFileChange}
                className="hidden"
              />
            </Button>
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
            <Button 
              variant="outline" 
              size="sm" 
              type="button"
              onClick={triggerFileInput}
            >
              Select File
              <Input
                ref={inputRef}
                id={inputId}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
